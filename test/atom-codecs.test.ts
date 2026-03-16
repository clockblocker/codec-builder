import { describe, expect, test } from "bun:test";
import {
	dateAndIsoStringDate,
	isoStringDateAndDate,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/date-and-iso-string-date";
import {
	emptiableStringAndNullishString,
	nullishStringAndEmptiableString,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/nullish-string-and-emptiable-string";
import {
	numberAndNullableNumericString,
	numericStringAndNullishNumber,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/numeric-string-and-nullish-number";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/yes-no-and-boolean";

describe("numericStringAndNullishNumber", () => {
	test("maps nullish input to null and uses a nullable output schema", () => {
		expect(numericStringAndNullishNumber.fromInput(undefined)).toBeNull();
		expect(numericStringAndNullishNumber.fromInput(null)).toBeNull();
		expect(numericStringAndNullishNumber.outputSchema.parse(null)).toBeNull();
		expect(() =>
			numericStringAndNullishNumber.outputSchema.parse(undefined),
		).toThrow();
	});

	test("keeps the reverse codec nullable-in and nullish-out", () => {
		expect(numberAndNullableNumericString.inputSchema.parse(null)).toBeNull();
		expect(() =>
			numberAndNullableNumericString.inputSchema.parse(undefined),
		).toThrow();
		expect(numberAndNullableNumericString.outputSchema.parse(undefined)).toBeUndefined();
	});
});

describe("dateAndIsoStringDate", () => {
	test("maps nullish input to null and uses a nullable date output schema", () => {
		expect(dateAndIsoStringDate.fromInput(undefined)).toBeNull();
		expect(dateAndIsoStringDate.fromInput(null)).toBeNull();
		expect(dateAndIsoStringDate.outputSchema.parse(null)).toBeNull();
		expect(() => dateAndIsoStringDate.outputSchema.parse(undefined)).toThrow();
	});

	test("keeps the reverse date codec nullable-in and nullish-out", () => {
		expect(isoStringDateAndDate.inputSchema.parse(null)).toBeNull();
		expect(() => isoStringDateAndDate.inputSchema.parse(undefined)).toThrow();
		expect(isoStringDateAndDate.outputSchema.parse(undefined)).toBeUndefined();
	});
});

describe("yesNoAndBoolean", () => {
	test("maps nullish booleans to null and uses a nullable yes/no output schema", () => {
		expect(yesNoAndBoolean.fromInput(undefined)).toBeNull();
		expect(yesNoAndBoolean.fromInput(null)).toBeNull();
		expect(yesNoAndBoolean.outputSchema.parse(null)).toBeNull();
		expect(() => yesNoAndBoolean.outputSchema.parse(undefined)).toThrow();
	});

	test("keeps the reverse boolean codec nullable-in and nullish-out", () => {
		expect(booleanAndYesNo.inputSchema.parse(null)).toBeNull();
		expect(() => booleanAndYesNo.inputSchema.parse(undefined)).toThrow();
		expect(booleanAndYesNo.outputSchema.parse(undefined)).toBeUndefined();
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
