import { describe, expect, test } from "bun:test";
import {
	nullableDateAndNullishIsoString,
	nullishIsoStringAndNullableDate,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/date-and-iso-string-date";
import {
	emptiableStringAndNullishString,
	nullishStringAndEmptiableString,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/nullish-string-and-emptiable-string";
import {
	nullableNumericStringAndNullishNumber,
	nullishNumberAndNullableNumericString,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/numeric-string-and-nullish-number";
import {
	nullableYesNoAndNullishBoolean,
	nullishBooleanAndNullableYesNo,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/yes-no-and-boolean";

describe("nullableNumericStringAndNullishNumber", () => {
	test("maps nullish input to null and uses a nullable output schema", () => {
		expect(nullableNumericStringAndNullishNumber.fromInput(undefined)).toBeNull();
		expect(nullableNumericStringAndNullishNumber.fromInput(null)).toBeNull();
		expect(nullableNumericStringAndNullishNumber.outputSchema.parse(null)).toBeNull();
		expect(() =>
			nullableNumericStringAndNullishNumber.outputSchema.parse(undefined),
		).toThrow();
	});

	test("keeps the reverse codec nullable-in and nullish-out", () => {
		expect(nullishNumberAndNullableNumericString.inputSchema.parse(null)).toBeNull();
		expect(() =>
			nullishNumberAndNullableNumericString.inputSchema.parse(undefined),
		).toThrow();
		expect(
			nullishNumberAndNullableNumericString.outputSchema.parse(undefined),
		).toBeUndefined();
	});
});

describe("nullableDateAndNullishIsoString", () => {
	test("maps nullish input to null and uses a nullable date output schema", () => {
		expect(nullableDateAndNullishIsoString.fromInput(undefined)).toBeNull();
		expect(nullableDateAndNullishIsoString.fromInput(null)).toBeNull();
		expect(nullableDateAndNullishIsoString.outputSchema.parse(null)).toBeNull();
		expect(() =>
			nullableDateAndNullishIsoString.outputSchema.parse(undefined),
		).toThrow();
	});

	test("keeps the reverse date codec nullable-in and nullish-out", () => {
		expect(nullishIsoStringAndNullableDate.inputSchema.parse(null)).toBeNull();
		expect(() =>
			nullishIsoStringAndNullableDate.inputSchema.parse(undefined),
		).toThrow();
		expect(
			nullishIsoStringAndNullableDate.outputSchema.parse(undefined),
		).toBeUndefined();
	});
});

describe("nullableYesNoAndNullishBoolean", () => {
	test("maps nullish booleans to null and uses a nullable yes/no output schema", () => {
		expect(nullableYesNoAndNullishBoolean.fromInput(undefined)).toBeNull();
		expect(nullableYesNoAndNullishBoolean.fromInput(null)).toBeNull();
		expect(nullableYesNoAndNullishBoolean.outputSchema.parse(null)).toBeNull();
		expect(() =>
			nullableYesNoAndNullishBoolean.outputSchema.parse(undefined),
		).toThrow();
	});

	test("keeps the reverse boolean codec nullable-in and nullish-out", () => {
		expect(nullishBooleanAndNullableYesNo.inputSchema.parse(null)).toBeNull();
		expect(() =>
			nullishBooleanAndNullableYesNo.inputSchema.parse(undefined),
		).toThrow();
		expect(
			nullishBooleanAndNullableYesNo.outputSchema.parse(undefined),
		).toBeUndefined();
	});
});

describe("nullishStringAndEmptiableString", () => {
	test("preserves the special emptiable-string behavior", () => {
		expect(emptiableStringAndNullishString.fromInput(undefined)).toBe("");
		expect(emptiableStringAndNullishString.fromOutput("")).toBeUndefined();
		expect(nullishStringAndEmptiableString.fromInput("")).toBeUndefined();
		expect(nullishStringAndEmptiableString.fromOutput(undefined)).toBe("");
	});
});
