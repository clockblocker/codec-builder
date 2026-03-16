import { describe, expect, test } from "bun:test";
import {
	intAndNumericString,
	numericStringAndInt,
} from "../src/field-codecs/molecules/numeric-string-and-int";

describe("numericStringAndInt", () => {
	test("serializes ints to numeric strings", () => {
		expect(numericStringAndInt.fromInput(42)).toBe("42");
		expect(numericStringAndInt.outputSchema.parse("42")).toBe("42");
		expect(numericStringAndInt.outputSchema.parse("42.5")).toBe("42.5");
		expect(() => numericStringAndInt.outputSchema.parse("")).toThrow();
	});

	test("parses numeric strings back to ints by flooring", () => {
		expect(numericStringAndInt.fromOutput("42")).toBe(42);
		expect(numericStringAndInt.fromOutput("42.9")).toBe(42);
		expect(intAndNumericString.fromInput("42.9")).toBe(42);
		expect(intAndNumericString.fromOutput(42)).toBe("42");
	});
});
