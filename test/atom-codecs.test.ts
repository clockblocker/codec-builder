import { describe, expect, test } from "bun:test";
import {
	nullableDateAndNullishIsoStringDate,
	nullishIsoStringDateAndNullableDate,
} from "../src/field-codecs/molecules/atoms/date-and-iso-string-date";
import {
	emptiableStringAndNullishString,
	nullishStringAndEmptiableString,
} from "../src/field-codecs/molecules/atoms/nullish-string-and-emptiable-string";
import {
	nullableNumericStringAndNullishNumber,
	nullishNumberAndNullableNumericString,
} from "../src/field-codecs/molecules/atoms/numeric-string-and-nullish-number";
import {
	nullableYesNoAndNullishBoolean,
	nullishBooleanAndNullableYesNo,
} from "../src/field-codecs/molecules/atoms/yes-no-and-boolean";

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
		expect(
			nullishNumberAndNullableNumericString.inputSchema.parse(null),
		).toBeNull();
		expect(() =>
			nullishNumberAndNullableNumericString.inputSchema.parse(undefined),
		).toThrow();
		expect(
			nullishNumberAndNullableNumericString.outputSchema.parse(undefined),
		).toBeUndefined();
	});
});

describe("nullableDateAndNullishIsoStringDate", () => {
	test("maps nullish input to null and uses a nullable date output schema", () => {
		expect(nullableDateAndNullishIsoStringDate.fromInput(undefined)).toBeNull();
		expect(nullableDateAndNullishIsoStringDate.fromInput(null)).toBeNull();
		expect(nullableDateAndNullishIsoStringDate.outputSchema.parse(null)).toBeNull();
		expect(() =>
			nullableDateAndNullishIsoStringDate.outputSchema.parse(undefined),
		).toThrow();
	});

	test("keeps the reverse date codec nullable-in and nullish-out", () => {
		expect(nullishIsoStringDateAndNullableDate.inputSchema.parse(null)).toBeNull();
		expect(() =>
			nullishIsoStringDateAndNullableDate.inputSchema.parse(undefined),
		).toThrow();
		expect(
			nullishIsoStringDateAndNullableDate.outputSchema.parse(undefined),
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
