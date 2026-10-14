import { describe, expect, test } from "bun:test";
import {
	intAndNumericString,
	nullableNumericStringAndInt,
	nullishIntAndNullableNumericString,
	numericStringAndInt,
} from "../src/v3/codec-builders/strict-field-adapter/field-codecs/molecules/int-and-numeric-string";

describe("numericStringAndInt", () => {
	test("serializes ints to numeric strings with strict schemas", () => {
		expect(numericStringAndInt.fromInput(42)).toBe("42");
		expect(numericStringAndInt.outputSchema.parse("42")).toBe("42");
		expect(() => numericStringAndInt.outputSchema.parse("42.5")).toThrow();
		expect(() =>
			numericStringAndInt.inputSchema.parse(undefined),
		).toThrow();
		expect(() =>
			intAndNumericString.inputSchema.parse(undefined),
		).toThrow();
	});

	test("parses integer strings back to ints", () => {
		expect(numericStringAndInt.fromOutput("42")).toBe(42);
		expect(numericStringAndInt.fromOutput("-7")).toBe(-7);
		expect(intAndNumericString.fromInput("+3")).toBe(3);
		expect(intAndNumericString.fromOutput(42)).toBe("42");
	});

	test("rejects non-integer strings instead of flooring them", () => {
		expect(() => numericStringAndInt.fromOutput("42.9")).toThrow();
		expect(() => intAndNumericString.fromInput("1.9")).toThrow();
		expect(() => intAndNumericString.inputSchema.parse("1.9")).toThrow();
		expect(intAndNumericString.inputSchema.parse("1")).toBe("1");
		expect(() => intAndNumericString.fromInput("0x1F")).toThrow();
		expect(() => intAndNumericString.inputSchema.parse("1e3")).toThrow();
		expect(() => intAndNumericString.inputSchema.parse("5.")).toThrow();
	});
});

describe("safe integer bounds", () => {
	test.each([Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, 0])(
		"round-trips %p",
		(n) => {
			const encoded = intAndNumericString.fromOutput(n);

			expect(intAndNumericString.inputSchema.parse(encoded)).toBe(
				encoded,
			);
			expect(intAndNumericString.fromInput(encoded) === n).toBeTrue();
			expect(intAndNumericString.outputSchema.parse(n)).toBe(n);
		},
	);

	test.each([
		Number.MAX_SAFE_INTEGER + 1,
		-Number.MAX_SAFE_INTEGER - 1,
		1e21,
	])("rejects %p", (n) => {
		expect(() => intAndNumericString.outputSchema.parse(n)).toThrow();
		expect(() => numericStringAndInt.inputSchema.parse(n)).toThrow();

		const encoded = String(n);
		expect(() => intAndNumericString.inputSchema.parse(encoded)).toThrow();
		expect(() => intAndNumericString.fromInput(encoded)).toThrow();
	});

	test("rejects unsafe digit strings on decode", () => {
		expect(() =>
			intAndNumericString.fromInput("9007199254740993"),
		).toThrow();
		expect(() =>
			intAndNumericString.fromInput("1000000000000000000000"),
		).toThrow();
	});
});

describe("nullableNumericStringAndInt", () => {
	test("keeps the nullable/nullish variant available", () => {
		expect(nullableNumericStringAndInt.fromInput(undefined)).toBeNull();
		expect(nullableNumericStringAndInt.fromInput(42)).toBe("42");
		expect(nullishIntAndNullableNumericString.fromInput("42")).toBe(42);
		expect(() =>
			nullishIntAndNullableNumericString.fromInput("42.9"),
		).toThrow();
		expect(nullishIntAndNullableNumericString.fromOutput(42)).toBe("42");
	});
});
