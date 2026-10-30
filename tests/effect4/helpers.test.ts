import { describe, expect, test } from "bun:test";
import { Schema, SchemaGetter } from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";
import { decodeIssues, encodeIssues, paths } from "./issues";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;
const numberFromString = c.nonNullish.number.and.numericString;

// The Type side rejects non-positive numbers; the Encoded side long strings.
const positive = Schema.String.check(Schema.isMaxLength(3)).pipe(
	Schema.decodeTo(Schema.Number.check(Schema.isGreaterThan(0)), {
		decode: SchemaGetter.transform(Number),
		encode: SchemaGetter.transform(String),
	}),
);

const optional = h.toOptional(numberFromString);
type _optional = [
	Expect<Equal<typeof optional.Type, number | undefined>>,
	Expect<Equal<typeof optional, Schema.optional<typeof numberFromString>>>,
];
const nullable = h.toNullable(numberFromString);
type _nullable = [
	Expect<Equal<typeof nullable.Type, number | null>>,
	Expect<Equal<typeof nullable.Encoded, string | null | undefined>>,
];
const defaulted = h.toNonNullishWithDefault(nullable, -1);
type _defaulted = [
	Expect<Equal<typeof defaulted.Type, number>>,
	Expect<Equal<typeof defaulted.Encoded, string | null | undefined>>,
];

describe("helper casters", () => {
	test("toOptional, toNullable, toNullish", () => {
		expect(
			Schema.decodeSync(h.toOptional(numberFromString))(undefined),
		).toBe(undefined);
		expect(
			Schema.decodeSync(h.toNullable(numberFromString))(undefined),
		).toBe(null);
		expect(Schema.decodeSync(h.toNullish(numberFromString))(null)).toBe(
			null,
		);
		expect(Schema.decodeSync(h.toNullish(numberFromString))("1.5")).toBe(
			1.5,
		);
		expect(Schema.encodeSync(h.toNullable(numberFromString))(null)).toBe(
			null,
		);
		expect(
			Schema.encodeSync(h.toNullish(numberFromString))(undefined),
		).toBe(undefined);
	});

	test("toNonNullishWithDefault takes a value or a function per decode", () => {
		expect(Schema.decodeSync(defaulted)(null)).toBe(-1);
		expect(Schema.decodeSync(defaulted)(undefined)).toBe(-1);
		expect(Schema.decodeSync(defaulted)("2")).toBe(2);
		expect(Schema.encodeSync(defaulted)(2)).toBe("2");

		let calls = 0;
		const counted = h.toNonNullishWithDefault(nullable, () => {
			calls += 1;
			return 0;
		});
		Schema.decodeSync(counted)("2");
		expect(calls).toBe(0);
		Schema.decodeSync(counted)(null);
		Schema.decodeSync(counted)(undefined);
		expect(calls).toBe(2);

		const list = h.toNonNullishWithDefault(
			h.toNullable(h.toArrayOf(numberFromString)),
			() => [],
		);
		expect(Schema.decodeSync(list)(["1", "2.5"])).toEqual([1, 2.5]);
		const first = Schema.decodeSync(list)(null);
		expect(Schema.decodeSync(list)(null)).not.toBe(first);
	});

	test("toArrayOf", () => {
		expect(
			Schema.decodeSync(h.toArrayOf(numberFromString))(["1", "2.5"]),
		).toEqual([1, 2.5]);
	});

	test("failures are reported with their path", () => {
		for (const wrapped of [
			h.toNullable(positive),
			h.toOptional(positive),
			h.toNullish(positive),
			h.toNonNullishWithDefault(h.toNullable(positive), 1),
		]) {
			expect(paths(decodeIssues(wrapped, "-1"))).toEqual([[]]);
			expect(paths(encodeIssues(wrapped, 12345))).toEqual([[]]);
		}
		const list = h.toArrayOf(positive);
		expect(paths(decodeIssues(list, ["1", "-1"]))).toEqual([[1]]);
		expect(paths(encodeIssues(list, [1, 12345]))).toEqual([[1]]);

		const codec = codecBuilder.buildStrictFieldAdapterCodec(
			Schema.Struct({
				prices: Schema.NullOr(Schema.Array(Schema.String)),
			}),
			{ prices: h.toNullable(h.toArrayOf(positive)) },
		);
		expect(paths(decodeIssues(codec, { prices: ["1", "-1"] }))).toEqual([
			["prices", 1],
		]);
	});
});

describe("pipeCodecs", () => {
	const msToDate = Schema.Number.pipe(
		Schema.decodeTo(Schema.Date, {
			decode: SchemaGetter.transform((ms) => new Date(ms)),
			encode: SchemaGetter.transform((date) => date.getTime()),
		}),
	);
	const piped = h.pipeCodecs(msToDate, c.nonNullish.isoString.and.date);

	type _piped = [
		Expect<Equal<typeof piped.Encoded, number>>,
		Expect<Equal<typeof piped.Type, string>>,
	];

	test("chains two codecs both ways; from and to are the two codecs", () => {
		expect(Schema.decodeSync(piped)(0)).toBe("1970-01-01T00:00:00.000Z");
		expect(Schema.encodeSync(piped)("1970-01-01T00:00:00.000Z")).toBe(0);
		expect(piped.from).toBe(msToDate);
		expect(piped.to).toBe(c.nonNullish.isoString.and.date);
	});

	test("a failure in either codec is reported", () => {
		const shortString = Schema.String.check(Schema.isMaxLength(3)).pipe(
			Schema.decodeTo(Schema.String, {
				decode: SchemaGetter.transform((value) => `[${value}]`),
				encode: SchemaGetter.transform((value) => value.slice(1, -1)),
			}),
		);
		const numberToShort = h.pipeCodecs(
			c.nonNullish.numericString.and.number,
			shortString,
		);
		expect(Schema.decodeSync(numberToShort)(123)).toBe("[123]");
		expect(decodeIssues(numberToShort, 12345)).toHaveLength(1);
		expect(encodeIssues(numberToShort, "[12345]")).toHaveLength(1);
	});

	const rejected = () =>
		h.pipeCodecs(
			msToDate,
			// @ts-expect-error the second codec must take what the first decodes
			c.nonNullish.number.and.numericString,
		);

	test("mismatched codecs are a type error", () => {
		expect(rejected).toBeFunction();
	});
});
