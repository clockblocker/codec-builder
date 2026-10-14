import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import {
	intAndNumericString,
	nullableNumericStringAndInt,
	nullishIntAndNullableNumericString,
	numericStringAndInt,
} from "../src/codec-builders/strict-field-adapter/field-codecs/molecules/int-and-numeric-string";

describe("numericStringAndInt", () => {
	test("serializes ints to numeric strings with strict schemas", () => {
		expect(numericStringAndInt.decode(42)).toBe("42");
		expect(numericStringAndInt.out.parse("42")).toBe("42");
		expect(() => numericStringAndInt.out.parse("42.5")).toThrow();
		expect(() => numericStringAndInt.in.parse(undefined)).toThrow();
		expect(() => intAndNumericString.in.parse(undefined)).toThrow();
	});

	test("parses integer numeric strings back to ints and rejects the rest", () => {
		expect(numericStringAndInt.encode("42")).toBe(42);
		expect(() => numericStringAndInt.encode("42.9")).toThrow(z.ZodError);
		expect(() => intAndNumericString.decode("1.9")).toThrow(z.ZodError);
		expect(() => intAndNumericString.decode("1e3")).toThrow(z.ZodError);
		expect(intAndNumericString.decode("-7")).toBe(-7);
		expect(intAndNumericString.encode(42)).toBe("42");
	});
});

describe("nullableNumericStringAndInt", () => {
	test("keeps the nullable/nullish variant available", () => {
		expect(nullableNumericStringAndInt.decode(undefined)).toBeNull();
		expect(nullableNumericStringAndInt.decode(42)).toBe("42");
		expect(nullishIntAndNullableNumericString.decode("42")).toBe(42);
		expect(() => nullishIntAndNullableNumericString.decode("42.9")).toThrow(
			z.ZodError,
		);
		expect(nullishIntAndNullableNumericString.encode(42)).toBe("42");
	});
});
