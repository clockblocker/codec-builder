import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const c = codecBuilder.fieldCodec;
const numberFromString = c.nonNullish.number.and.numericString;
const stringFromNumber = c.nonNullish.numericString.and.number;
const intFromString = c.nonNullish.int.and.numericString;
const stringFromInt = c.nonNullish.numericString.and.int;

const accepted = ["12", "-3.5", "+4", ".5", "5.", "1e3", "1e+21", "1e-7", "0"];
const rejected = [
	"",
	" ",
	" 12 ",
	"12 ",
	"0x1F",
	"0b11",
	"0o7",
	"Infinity",
	"-Infinity",
	"NaN",
	"1e999",
	"1,5",
	"abc",
	"1e",
	".",
];

describe("numeric string parsing", () => {
	test("accepts decimal numbers with an optional exponent", () => {
		for (const value of accepted) {
			expect(numberFromString.decode(value)).toBe(Number(value));
		}
	});

	test("rejects whitespace, other radixes, and non-finite values", () => {
		for (const value of rejected) {
			expect(() => numberFromString.decode(value)).toThrow(z.ZodError);
			expect(stringFromNumber.safeEncode(value).success).toBeFalse();
		}
	});

	test("the int codec rejects non-integers instead of flooring", () => {
		expect(intFromString.decode("2")).toBe(2);
		expect(() => intFromString.decode("1.9")).toThrow(z.ZodError);
		expect(() => intFromString.decode("0x10")).toThrow(z.ZodError);
		expect(() => stringFromInt.decode(1.5)).toThrow(z.ZodError);
	});

	test("decode(encode(n)) === n for numbers whose string form varies", () => {
		const numbers = [
			0,
			-0,
			0.1,
			1e21,
			1e-7,
			Number.MAX_SAFE_INTEGER,
			-123.456,
		];
		for (const n of numbers) {
			// number side -> string side -> number side
			expect(
				numberFromString.decode(numberFromString.encode(n)) === n,
			).toBeTrue();
			// the inverted codec: encode a string from n, decode it back
			expect(
				stringFromNumber.encode(stringFromNumber.decode(n)) === n,
			).toBeTrue();
		}
	});

	test("the int codecs only accept safe integers", () => {
		for (const unsafe of [Number.MAX_SAFE_INTEGER + 1, 1e21, -1e21]) {
			// int side (z.number().int() is limited to the safe range)
			expect(stringFromInt.safeDecode(unsafe).success).toBeFalse();
			expect(intFromString.safeEncode(unsafe).success).toBeFalse();
			// numeric-string side
			expect(
				intFromString.safeDecode(String(unsafe)).success,
			).toBeFalse();
			expect(
				stringFromInt.safeEncode(String(unsafe)).success,
			).toBeFalse();
		}
		expect(
			intFromString.safeDecode("9007199254740992").success,
		).toBeFalse();
		expect(intFromString.safeDecode("1e21").success).toBeFalse();
	});

	test("decode(encode(n)) === n for the int codec", () => {
		for (const n of [
			0,
			-0,
			7,
			-42,
			Number.MAX_SAFE_INTEGER,
			-Number.MAX_SAFE_INTEGER,
		]) {
			expect(
				intFromString.decode(intFromString.encode(n)) === n,
			).toBeTrue();
		}
	});
});
