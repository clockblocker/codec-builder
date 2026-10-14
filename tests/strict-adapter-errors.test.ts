import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;

// The source side accepts any string; the field codecs are stricter, so
// their failures happen inside the object codec's transform.
const row = z.object({
	balance: z.string(),
	items: z.array(z.object({ price: z.string() })),
	owner: z.object({ since: z.string() }).nullable(),
	// encode fails inside the field codec: the source side is max(3)
	code: z.string(),
});

const shortCode = z.codec(z.string().max(3), z.number(), {
	decode: Number,
	encode: String,
});

const codec = codecBuilder.buildStrictFieldAdapterCodec(row, {
	balance: c.nonNullish.number.and.numericString,
	items: c.arrayOf({ price: c.nonNullish.number.and.numericString }),
	owner: { since: c.nonNullish.date.and.isoString },
	code: shortCode,
});

const valid = {
	balance: "1",
	items: [{ price: "1" }, { price: "2" }, { price: "3" }],
	owner: { since: "2024-01-02" },
	code: "7",
};

const paths = (error: z.ZodError | undefined) =>
	error?.issues.map((issue) => issue.path);

describe("field codec failures inside the object transform", () => {
	test("safeDecode returns success: false with the full path", () => {
		const result = codec.safeDecode({ ...valid, balance: "x" });
		expect(result.success).toBeFalse();
		expect(paths(result.error)).toEqual([["balance"]]);
		expect(result.error?.issues[0]?.message).toBe(
			"Expected a numeric string",
		);
	});

	test("paths reach into arrays and nested objects", () => {
		const result = codec.safeDecode({
			...valid,
			items: [{ price: "1" }, { price: "2" }, { price: "nope" }],
			owner: { since: "yesterday" },
		});
		expect(result.success).toBeFalse();
		expect(paths(result.error)).toEqual([
			["items", 2, "price"],
			["owner", "since"],
		]);
	});

	test("safeParse and z.safeDecode behave the same", () => {
		const input = { ...valid, balance: "x" };
		expect(codec.safeParse(input).success).toBeFalse();
		expect(paths(z.safeDecode(codec, input).error)).toEqual([["balance"]]);
	});

	test("safeEncode returns success: false with the full path", () => {
		const decoded = codec.decode(valid);
		const result = codec.safeEncode({ ...decoded, code: 12345 });
		expect(result.success).toBeFalse();
		expect(paths(result.error)).toEqual([["code"]]);
	});

	test("decode and encode throw a ZodError with the full path", () => {
		expect(() => codec.decode({ ...valid, balance: "x" })).toThrow(
			z.ZodError,
		);
		try {
			codec.decode({ ...valid, balance: "x" });
		} catch (error) {
			expect(paths(error as z.ZodError)).toEqual([["balance"]]);
		}
	});

	test("the schema-free adapter throws a ZodError with the full path", () => {
		const adapter = codecBuilder.buildStrictFieldAdapter<{
			items: { price: string }[];
		}>()({
			items: c.arrayOf({ price: c.nonNullish.number.and.numericString }),
		});
		let caught: unknown;
		try {
			adapter.decode({ items: [{ price: "1" }, { price: "x" }] });
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(z.ZodError);
		expect(paths(caught as z.ZodError)).toEqual([["items", 1, "price"]]);
	});
});

describe("pipeCodecs", () => {
	const numberToString = z.codec(z.number(), z.string(), {
		decode: String,
		encode: Number,
	});
	const shortString = z.codec(z.string().max(3), z.string(), {
		decode: (value) => `[${value}]`,
		encode: (value) => value.slice(1, -1),
	});
	const piped = h.pipeCodecs(numberToString, shortString);

	test("a failure in the second codec is reported, not thrown", () => {
		const result = piped.safeDecode(12345);
		expect(result.success).toBeFalse();
		expect(result.error?.issues[0]?.code).toBe("too_big");
		expect(piped.safeEncode("[12345]").success).toBeFalse();
		expect(piped.decode(123)).toBe("[123]");
		expect(piped.encode("[123]")).toBe(123);
	});

	test("nested paths survive the pipe", () => {
		const typed = codecBuilder.buildStrictFieldAdapterCodec(
			z.object({ qty: z.string() }),
			{ qty: c.nonNullish.int.and.numericString },
		);
		const reshaped = codecBuilder.buildReshapeCodec(typed.out, {
			fieldName: "count",
			fieldSchema: z.number(),
			dropFields: ["qty"],
			construct: (value) => value.qty,
			reconstruct: (count) => ({ qty: count }),
		});
		const pipedObject = h.pipeCodecs(typed, reshaped);
		expect(pipedObject.decode({ qty: "2" })).toEqual({ count: 2 });
		const result = pipedObject.safeDecode({ qty: "x" });
		expect(result.success).toBeFalse();
		expect(paths(result.error)).toEqual([["qty"]]);
	});

	test("a shared middle schema is validated once per direction", () => {
		let checks = 0;
		const middle = z.string().refine(() => {
			checks++;
			return true;
		});
		const left = z.codec(z.number(), middle, {
			decode: String,
			encode: Number,
		});
		const right = z.codec(middle, z.string(), {
			decode: (value) => value,
			encode: (value) => value,
		});
		const pipedOnce = h.pipeCodecs(left, right);

		pipedOnce.decode(1);
		expect(checks).toBe(1);
		checks = 0;
		pipedOnce.encode("1");
		expect(checks).toBe(1);
	});
});
