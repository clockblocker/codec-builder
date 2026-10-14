import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const c = codecBuilder.fieldCodec;

// Each field codec runs once per call: its `in` is validated, it transforms,
// and its `out` is validated (by the object's `out`), each exactly once.

function counted() {
	const counts = { in: 0, out: 0 };
	const inSchema = z.string().refine(() => {
		counts.in++;
		return true;
	});
	const outSchema = z.number().refine(() => {
		counts.out++;
		return true;
	});
	const codec = z.codec(inSchema, outSchema, {
		decode: Number,
		encode: String,
	});
	const reset = () => {
		counts.in = 0;
		counts.out = 0;
	};
	return { counts, codec, inSchema, reset };
}

describe("field codecs run once", () => {
	test("a refine on a field codec's out runs once per decode and encode", () => {
		const { counts, codec, reset } = counted();
		const adapter = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ a: z.string() }),
			{ a: codec },
		);
		adapter.decode({ a: "1" });
		expect(counts).toEqual({ in: 1, out: 1 });
		reset();
		adapter.encode({ a: 1 });
		expect(counts).toEqual({ in: 1, out: 1 });
	});

	test("the same holds in nested shapes and arrayOf items", () => {
		const { counts, codec, reset } = counted();
		const adapter = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({
				nested: z.object({ a: z.string() }),
				items: z.array(z.string()),
			}),
			{ nested: { a: codec }, items: c.arrayOf(codec) },
		);
		adapter.decode({ nested: { a: "1" }, items: ["2", "3"] });
		expect(counts).toEqual({ in: 3, out: 3 });
		reset();
		adapter.encode({ nested: { a: 1 }, items: [2, 3] });
		expect(counts).toEqual({ in: 3, out: 3 });
	});

	test("a source field that is the codec's own in schema is checked once", () => {
		const { counts, codec, inSchema, reset } = counted();
		const adapter = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ a: inSchema }),
			{ a: codec },
		);
		adapter.decode({ a: "1" });
		expect(counts).toEqual({ in: 1, out: 1 });
		reset();
		adapter.encode({ a: 1 });
		expect(counts).toEqual({ in: 1, out: 1 });
	});

	test("the schema-free adapter runs each codec once", () => {
		const { counts, codec, reset } = counted();
		const adapter = codecBuilder.buildStrictFieldAdapter<{ a: string }>()({
			a: codec,
		});
		adapter.decode({ a: "1" });
		expect(counts).toEqual({ in: 1, out: 1 });
		reset();
		adapter.encode({ a: 1 });
		expect(counts).toEqual({ in: 1, out: 1 });
	});

	test("an out failure is still reported once, with its path", () => {
		const positive = z.codec(z.string(), z.number().positive(), {
			decode: Number,
			encode: String,
		});
		const adapter = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ items: z.array(z.string()) }),
			{ items: c.arrayOf(positive) },
		);
		const result = adapter.safeDecode({ items: ["1", "-1"] });
		expect(result.success).toBeFalse();
		expect(result.error?.issues.map((issue) => issue.path)).toEqual([
			["items", 1],
		]);
	});
});
