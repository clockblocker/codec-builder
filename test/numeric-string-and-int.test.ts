import { describe, expect, test } from "bun:test";
import {
	nullableNumericStringAndNullishInt,
	nullishIntAndNullableNumericString,
} from "../src/codec-builders/strict-field-adapter/field-codecs/molecules/numeric-string-and-int";

describe("nullableNumericStringAndNullishInt", () => {
	test("serializes ints to numeric strings", () => {
		expect(nullableNumericStringAndNullishInt.fromInput(42)).toBe("42");
		expect(nullableNumericStringAndNullishInt.outputSchema.parse("42")).toBe("42");
		expect(nullableNumericStringAndNullishInt.outputSchema.parse("42.5")).toBe(
			"42.5",
		);
		expect(() =>
			nullableNumericStringAndNullishInt.outputSchema.parse(""),
		).toThrow();
	});

	test("parses numeric strings back to ints by flooring", () => {
		expect(nullableNumericStringAndNullishInt.fromOutput("42")).toBe(42);
		expect(nullableNumericStringAndNullishInt.fromOutput("42.9")).toBe(42);
		expect(nullishIntAndNullableNumericString.fromInput("42.9")).toBe(42);
		expect(nullishIntAndNullableNumericString.fromOutput(42)).toBe("42");
	});
});
