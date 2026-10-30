import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";

const c = codecBuilder.fieldCodec;

const decode = (schema: Schema.Codec<unknown, unknown>, value: unknown) =>
	Schema.decodeUnknownSync(schema)(value);
const encode = (schema: Schema.Codec<unknown, unknown>, value: unknown) =>
	Schema.encodeUnknownSync(schema)(value);
const decodes = (schema: Schema.Codec<unknown, unknown>, value: unknown) =>
	Schema.decodeUnknownExit(schema)(value)._tag === "Success";
const encodes = (schema: Schema.Codec<unknown, unknown>, value: unknown) =>
	Schema.encodeUnknownExit(schema)(value)._tag === "Success";

// The catalog has the same paths as the Zod one.
type _paths = [
	Expect<Equal<typeof c.nonNullish.number.and.numericString.Type, number>>,
	Expect<Equal<typeof c.nonNullish.number.and.numericString.Encoded, string>>,
	Expect<Equal<typeof c.nullable.date.and.isoString.Type, Date | null>>,
	Expect<
		Equal<
			typeof c.nullable.date.and.isoString.Encoded,
			string | null | undefined
		>
	>,
	Expect<
		Equal<typeof c.optional.int.and.numericString.Type, number | undefined>
	>,
	Expect<
		Equal<
			typeof c.nullish.boolean.and.yesNo.Type,
			boolean | null | undefined
		>
	>,
	Expect<Equal<typeof c.nonNullish.date.and.nullish.isoString.Type, Date>>,
	Expect<
		Equal<
			typeof c.nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString.Type,
			ReadonlyArray<string>
		>
	>,
];

describe("field codec catalog", () => {
	test("every path exists", () => {
		const paths = [
			c.optional.date.and.isoString,
			c.nullish.date.and.isoString,
			c.nonNullish.string.and.nullish.string,
			c.nullable.string.and.string,
			c.optional.number.and.numericString,
			c.nullish.number.and.numericString,
			c.nonNullish.number.and.nullish.numericString,
			c.nullable.number.and.numericString,
			c.optional.numericString.and.number,
			c.optional.numericString.and.int,
			c.nullish.numericString.and.number,
			c.nullish.numericString.and.int,
			c.nonNullish.numericString.and.int,
			c.nonNullish.numericString.and.nullish.number,
			c.nonNullish.numericString.and.nullish.int,
			c.nullable.numericString.and.number,
			c.nullable.numericString.and.int,
			c.optional.isoString.and.date,
			c.nullish.isoString.and.date,
			c.nonNullish.date.and.isoString,
			c.nonNullish.date.and.nullish.isoString,
			c.nullable.date.and.isoString,
			c.nonNullish.isoString.and.date,
			c.nonNullish.isoString.and.nullish.date,
			c.nullable.isoString.and.date,
			c.optional.yesNo.and.boolean,
			c.nullish.yesNo.and.boolean,
			c.nonNullish.yesNo.and.boolean,
			c.nonNullish.yesNo.and.nullish.boolean,
			c.nullable.yesNo.and.boolean,
			c.optional.boolean.and.yesNo,
			c.nullish.boolean.and.yesNo,
			c.nonNullish.boolean.and.yesNo,
			c.nonNullish.boolean.and.nullish.yesNo,
			c.nullable.boolean.and.yesNo,
			c.optional.int.and.numericString,
			c.nullish.int.and.numericString,
			c.nonNullish.int.and.numericString,
			c.nonNullish.int.and.nullish.numericString,
			c.nullable.int.and.numericString,
			c.nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString,
		];
		for (const codec of paths) {
			expect(Schema.isSchema(codec)).toBeTrue();
		}
	});

	test("nullability prefixes", () => {
		expect(decode(c.nullable.string.and.string, undefined)).toBeNull();
		expect(decode(c.nonNullish.string.and.nullish.string, null)).toBe("");
		expect(encode(c.nonNullish.string.and.nullish.string, "x")).toBe("x");

		expect(
			decode(c.nullable.numericString.and.number, undefined),
		).toBeNull();
		expect(decode(c.optional.numericString.and.number, undefined)).toBe(
			undefined,
		);
		expect(decode(c.nullish.numericString.and.number, null)).toBeNull();
		expect(
			decode(c.nonNullish.numericString.and.nullish.number, undefined),
		).toBe("0");
		expect(decode(c.nonNullish.numericString.and.nullish.int, null)).toBe(
			"0",
		);

		expect(decode(c.nullable.number.and.numericString, null)).toBeNull();
		expect(
			decode(c.nonNullish.number.and.nullish.numericString, undefined),
		).toBe(0);

		expect(decode(c.nullable.yesNo.and.boolean, undefined)).toBeNull();
		expect(decode(c.nonNullish.yesNo.and.nullish.boolean, null)).toBe("No");
		expect(decode(c.nonNullish.boolean.and.nullish.yesNo, null)).toBe(
			false,
		);
		expect(decode(c.nullish.boolean.and.yesNo, undefined)).toBeUndefined();

		expect(decode(c.nonNullish.int.and.nullish.numericString, null)).toBe(
			0,
		);
		expect(decode(c.nullable.int.and.numericString, "7")).toBe(7);
	});

	test("the Type side of nullable codecs rejects undefined", () => {
		const nullable = c.nullable.number.and.numericString;
		expect(Schema.is(Schema.toType(nullable))(null)).toBeTrue();
		expect(Schema.is(Schema.toType(nullable))(undefined)).toBeFalse();
		expect(encodes(nullable, undefined)).toBeFalse();
	});

	test("yesNo codecs reject other strings", () => {
		expect(decodes(c.nonNullish.boolean.and.yesNo, "maybe")).toBeFalse();
		expect(decodes(c.nonNullish.boolean.and.yesNo, "yes")).toBeFalse();
		expect(decode(c.nonNullish.yesNo.and.boolean, true)).toBe("Yes");
		expect(encode(c.nonNullish.yesNo.and.boolean, "No")).toBeFalse();
	});
});

describe("numeric strings", () => {
	const numberFromString = c.nonNullish.number.and.numericString;
	const stringFromNumber = c.nonNullish.numericString.and.number;
	const intFromString = c.nonNullish.int.and.numericString;
	const stringFromInt = c.nonNullish.numericString.and.int;

	const accepted = ["12", "-3.5", "+4", ".5", "5.", "1e3", "1e+21", "1e-7"];
	const rejected = [
		"",
		" ",
		" 12 ",
		"0x1F",
		"0b11",
		"Infinity",
		"NaN",
		"1e999",
		"1,5",
		"abc",
		"1e",
		".",
	];

	test("accept decimal numbers with an optional exponent", () => {
		for (const value of accepted) {
			expect(decode(numberFromString, value)).toBe(Number(value));
		}
	});

	test("reject whitespace, other radixes and non-finite values", () => {
		for (const value of rejected) {
			expect(decodes(numberFromString, value)).toBeFalse();
			expect(encodes(stringFromNumber, value)).toBeFalse();
		}
		expect(decodes(stringFromNumber, Number.NaN)).toBeFalse();
		expect(decodes(stringFromNumber, Number.POSITIVE_INFINITY)).toBeFalse();
	});

	test("decode(encode(n)) === n", () => {
		for (const n of [
			0,
			0.1,
			1e21,
			1e-7,
			Number.MAX_SAFE_INTEGER,
			-123.456,
		]) {
			expect(decode(numberFromString, encode(numberFromString, n))).toBe(
				n,
			);
		}
	});

	test("int codecs take digits only and safe integers", () => {
		expect(decode(intFromString, "-42")).toBe(-42);
		expect(decode(intFromString, "+7")).toBe(7);
		for (const value of [
			"1.9",
			"1e3",
			"1.0",
			"0x10",
			"+",
			"",
			"9007199254740992",
		]) {
			expect(decodes(intFromString, value)).toBeFalse();
			expect(encodes(stringFromInt, value)).toBeFalse();
		}
		expect(decodes(stringFromInt, 1.5)).toBeFalse();
		expect(decodes(stringFromInt, Number.MAX_SAFE_INTEGER + 1)).toBeFalse();
		expect(encode(intFromString, -Number.MAX_SAFE_INTEGER)).toBe(
			String(-Number.MAX_SAFE_INTEGER),
		);
	});
});

describe("dates", () => {
	const dateFromIso = {
		"nonNullish.date.and.isoString": c.nonNullish.date.and.isoString,
		"nullable.date.and.isoString": c.nullable.date.and.isoString,
		"nullish.date.and.isoString": c.nullish.date.and.isoString,
		"nonNullish.date.and.nullish.isoString":
			c.nonNullish.date.and.nullish.isoString,
	} as const;

	for (const [path, codec] of Object.entries(dateFromIso)) {
		test(`${path} rejects strings that are not ISO dates`, () => {
			for (const garbage of [
				"",
				"yesterday",
				"2024-13-01",
				"2023-02-29",
				"2024-01-01T00:00:00",
				"01/02/2024",
			]) {
				expect(decodes(codec, garbage)).toBeFalse();
			}
		});

		test(`${path} decodes ISO dates and datetimes`, () => {
			expect(decode(codec, "2024-01-02")).toEqual(
				new Date("2024-01-02T00:00:00.000Z"),
			);
			expect(decode(codec, "2024-02-29")).toEqual(
				new Date("2024-02-29T00:00:00.000Z"),
			);
			expect(decode(codec, "2024-01-02T03:04:05+02:00")).toEqual(
				new Date("2024-01-02T01:04:05.000Z"),
			);
		});
	}

	test("encode gives ISO strings and rejects invalid dates", () => {
		expect(
			encode(c.nonNullish.date.and.isoString, new Date("2024-01-02")),
		).toBe("2024-01-02T00:00:00.000Z");
		expect(
			encodes(c.nonNullish.date.and.isoString, new Date("nope")),
		).toBeFalse();
		expect(decode(c.nonNullish.isoString.and.date, new Date(0))).toBe(
			"1970-01-01T00:00:00.000Z",
		);
	});

	test("defaults are taken per decode", async () => {
		const codec = c.nonNullish.date.and.nullish.isoString;
		const first = decode(codec, null) as Date;
		await Bun.sleep(5);
		const before = Date.now();
		const second = decode(codec, undefined) as Date;
		expect(second.getTime()).toBeGreaterThanOrEqual(before);
		expect(second.getTime()).toBeGreaterThan(first.getTime());

		const iso = decode(c.nonNullish.isoString.and.nullish.date, null);
		expect(typeof iso).toBe("string");
	});
});

describe("nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString", () => {
	const codec =
		c.nonNullish.array.nonEmptyString.and.nullishArrayOfNullishString;

	test("drops nullish and empty items; a missing array becomes []", () => {
		expect(decode(codec, ["a", null, "", undefined, "b"])).toEqual([
			"a",
			"b",
		]);
		expect(decode(codec, null)).toEqual([]);
		expect(decode(codec, undefined)).toEqual([]);
		const struct = Schema.Struct({ tags: codec });
		expect(Schema.decodeUnknownSync(struct)({})).toEqual({ tags: [] });
	});

	test("encodes non-empty strings back", () => {
		expect(encode(codec, ["a", "b"])).toEqual(["a", "b"]);
		expect(encodes(codec, [""])).toBeFalse();
	});

	test("flips with Schema.flip", () => {
		expect(
			Schema.encodeUnknownSync(Schema.flip(codec))(["a", null, ""]),
		).toEqual(["a"]);
	});
});
