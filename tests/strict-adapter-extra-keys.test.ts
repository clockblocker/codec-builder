import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const c = codecBuilder.fieldCodec;
const build = codecBuilder.buildStrictFieldAdapterCodec;

const row = z.object({
	id: z.number(),
	profile: z.object({ nick: z.string() }).nullable(),
	lines: z.array(z.object({ qty: z.string() })),
});

const topLevel = () =>
	build(row, {
		id: c.noOp,
		profile: { nick: c.noOp },
		lines: c.arrayOf({ qty: c.noOp }),
		// @ts-expect-error bogus is not a key of the schema
		bogus: c.noOp,
	});

const nested = () =>
	build(row, {
		id: c.noOp,
		// @ts-expect-error a nested shape gets the same check
		profile: { nick: c.noOp, bogus: c.noOp },
		lines: c.arrayOf({ qty: c.noOp }),
	});

const arrayItem = () =>
	build(row, {
		id: c.noOp,
		profile: { nick: c.noOp },
		// @ts-expect-error so does an arrayOf item shape
		lines: c.arrayOf({ qty: c.noOp, bogus: c.noOp }),
	});

const adapter = () =>
	codecBuilder.buildStrictFieldAdapter<{ id: number }>()({
		id: c.noOp,
		// @ts-expect-error the schema-free adapter rejects extra keys too
		bogus: c.noOp,
	});

describe("extra shape keys", () => {
	test("still throw at runtime when the types are bypassed", () => {
		expect(topLevel).toThrow('Codec shape key "bogus" is not in schema.');
		expect(nested).toThrow('Codec shape key "bogus" is not in schema.');
		expect(arrayItem).toThrow('Codec shape key "bogus" is not in schema.');
		expect(adapter).not.toThrow();
	});
});
