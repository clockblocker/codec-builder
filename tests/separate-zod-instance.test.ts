import { describe, expect, test } from "bun:test";
import { createRequire } from "node:module";
import { z as zEsm } from "zod/v4";
import { codecBuilder } from "../src";

// A consumer that calls require("zod") gets Zod's CommonJS build, while the
// library imports the ESM build: two Zod instances with different classes.
// Zod 4 classes answer `instanceof` by checking the instance's `_zod.traits`,
// so the library's `instanceof z.ZodEnum` / `instanceof z.ZodCodec` checks
// still hold for schemas from the other instance. These tests pin that.
const { z } = createRequire(import.meta.url)("zod") as {
	z: typeof import("zod/v4").z;
};

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;

describe("schemas from a separate Zod instance", () => {
	test("the test really has two Zod instances", () => {
		expect(z.ZodEnum).not.toBe(zEsm.ZodEnum);
	});

	test("buildNullableUnionAndNullishString accepts a foreign z.enum", () => {
		const status = h.buildNullableUnionAndNullishString(
			z.enum(["draft", "published"]),
		);

		expect(status.decode("draft")).toBe("draft");
		expect(status.decode("archived")).toBeNull();
		expect(status.encode("published")).toBe("published");
	});

	test("pipeCodecs composes foreign codecs as Zod codecs", () => {
		const msToDate = z.codec(z.number(), z.date(), {
			decode: (ms) => new Date(ms),
			encode: (date) => date.getTime(),
		});
		const dateToIso = z.codec(z.date(), z.string(), {
			decode: (date) => date.toISOString(),
			encode: (iso) => new Date(iso),
		});
		const piped = h.pipeCodecs(msToDate, dateToIso);

		expect(piped.decode(0)).toBe("1970-01-01T00:00:00.000Z");
		expect(piped.encode("1970-01-01T00:00:00.000Z")).toBe(0);
		expect(piped.safeDecode("0" as never).success).toBeFalse();
	});

	test("buildStrictFieldAdapterCodec accepts foreign schemas and codecs", () => {
		const centsToDollars = z.codec(z.number().int(), z.number(), {
			decode: (cents) => cents / 100,
			encode: (dollars) => Math.round(dollars * 100),
		});
		const row = z.object({
			id: z.number(),
			vip: z.enum(["Yes", "No"]),
			total: z.number().int(),
			customer: z.object({ name: z.string() }),
			lines: z.array(z.object({ qty: z.string() })),
		});
		const codec = codecBuilder.buildStrictFieldAdapterCodec(row, {
			id: c.noOp,
			vip: c.nonNullish.boolean.and.yesNo,
			total: centsToDollars,
			customer: { name: c.noOp },
			lines: c.arrayOf({ qty: c.nonNullish.int.and.numericString }),
		});
		const input = {
			id: 1,
			vip: "Yes" as const,
			total: 1999,
			customer: { name: "Ada" },
			lines: [{ qty: "3" }],
		};

		const decoded = codec.decode(input);
		expect(decoded).toEqual({
			id: 1,
			vip: true,
			total: 19.99,
			customer: { name: "Ada" },
			lines: [{ qty: 3 }],
		});
		expect(codec.encode(decoded)).toEqual(input);
	});

	test("buildReshapeCodec and buildFixedFieldsCodec accept foreign schemas", () => {
		const person = codecBuilder.buildReshapeCodec(
			z.object({ first: z.string(), last: z.string() }),
			{
				fieldName: "name",
				fieldSchema: z.string(),
				dropFields: ["first", "last"],
				construct: (row) => `${row.first} ${row.last}`,
				reconstruct: (name) => {
					const [first = "", last = ""] = name.split(" ");
					return { first, last };
				},
			},
		);
		expect(person.decode({ first: "Ada", last: "L" })).toEqual({
			name: "Ada L",
		});

		const lemma = codecBuilder.buildFixedFieldsCodec(
			z.strictObject({ language: z.literal("de"), form: z.string() }),
			{ language: "de" },
		);
		expect(lemma.decode({ form: "Bank" })).toEqual({
			language: "de",
			form: "Bank",
		});
		expect(lemma.encode({ language: "de", form: "Bank" })).toEqual({
			form: "Bank",
		});
	});
});
