import { describe, expect, test } from "bun:test";
import {
	dateAndIsoString,
	isoStringAndDate,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/core-non-nullable-codecs/date-and-iso-string";
import {
	nullableDateAndIsoString,
	nullableIsoStringAndDate,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/derived/date";
import {
	nullishStringAndString,
	stringAndNullish,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/derived/string";
import {
	numberAndNumericString,
	numericStringAndNumber,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/core-non-nullable-codecs/numeric-string-and-number";
import {
	nullableNumericStringAndNumber,
	nullableNumberAndNumericString,
	numberAndNullishNumericString,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/derived/number";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/core-non-nullable-codecs/yes-no-and-boolean";
import {
	nullableBooleanAndYesNo,
	nullableYesNoAndBoolean,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/derived/yes-no";

describe("numericStringAndNumber", () => {
	test("uses strict non-nullable schemas in both directions", () => {
		expect(numericStringAndNumber.fromInput(42)).toBe("42");
		expect(numberAndNumericString.fromInput("42")).toBe(42);
		expect(() => numericStringAndNumber.inputSchema.parse(undefined)).toThrow();
		expect(() => numberAndNumericString.inputSchema.parse(undefined)).toThrow();
	});

	test("defaults nullish numeric strings to zero only for the number-facing codec", () => {
		expect(numberAndNullishNumericString.fromInput(undefined)).toBe(0);
		expect(numberAndNullishNumericString.fromInput(null)).toBe(0);
		expect(numberAndNullishNumericString.fromInput("42")).toBe(42);
	});
});

describe("nullableNumericStringAndNumber", () => {
	test("maps nullish input to null and uses a nullable output schema", () => {
		expect(
			nullableNumericStringAndNumber.fromInput(undefined),
		).toBeNull();
		expect(nullableNumericStringAndNumber.fromInput(null)).toBeNull();
		expect(
			nullableNumericStringAndNumber.outputSchema.parse(null),
		).toBeNull();
		expect(() =>
			nullableNumericStringAndNumber.outputSchema.parse(undefined),
		).toThrow();
	});

	test("keeps the reverse codec nullable-in and nullish-out", () => {
		expect(nullableNumberAndNumericString.inputSchema.parse(null)).toBeNull();
		expect(() =>
			nullableNumberAndNumericString.inputSchema.parse(undefined),
		).toThrow();
		expect(nullableNumberAndNumericString.outputSchema.parse(undefined)).toBeUndefined();
	});
});

describe("dateAndIsoString", () => {
	test("uses strict non-nullable schemas in both directions", () => {
		const date = dateAndIsoString.fromInput("2024-01-01");
		expect(date).toBeInstanceOf(Date);
		expect(isoStringAndDate.fromInput(date)).toBe("2024-01-01T00:00:00.000Z");
		expect(() => dateAndIsoString.inputSchema.parse(undefined)).toThrow();
		expect(() => isoStringAndDate.inputSchema.parse(undefined)).toThrow();
	});
});

describe("nullableDateAndIsoString", () => {
	test("maps nullish input to null and uses a nullable date output schema", () => {
		expect(nullableDateAndIsoString.fromInput(undefined)).toBeNull();
		expect(nullableDateAndIsoString.fromInput(null)).toBeNull();
		expect(nullableDateAndIsoString.outputSchema.parse(null)).toBeNull();
		expect(() => nullableDateAndIsoString.outputSchema.parse(undefined)).toThrow();
	});

	test("keeps the reverse date codec nullable-in and nullish-out", () => {
		expect(nullableIsoStringAndDate.inputSchema.parse(null)).toBeNull();
		expect(() => nullableIsoStringAndDate.inputSchema.parse(undefined)).toThrow();
		expect(nullableIsoStringAndDate.outputSchema.parse(undefined)).toBeUndefined();
	});
});

describe("yesNoAndBoolean", () => {
	test("uses strict non-nullable schemas in both directions", () => {
		expect(yesNoAndBoolean.fromInput(true)).toBe("Yes");
		expect(booleanAndYesNo.fromInput("No")).toBe(false);
		expect(() => yesNoAndBoolean.inputSchema.parse(undefined)).toThrow();
		expect(() => booleanAndYesNo.inputSchema.parse(undefined)).toThrow();
	});
});

describe("nullableYesNoAndBoolean", () => {
	test("maps nullish booleans to null and uses a nullable yes/no output schema", () => {
		expect(nullableYesNoAndBoolean.fromInput(undefined)).toBeNull();
		expect(nullableYesNoAndBoolean.fromInput(null)).toBeNull();
		expect(nullableYesNoAndBoolean.outputSchema.parse(null)).toBeNull();
		expect(() => nullableYesNoAndBoolean.outputSchema.parse(undefined)).toThrow();
	});

	test("keeps the reverse boolean codec nullable-in and nullish-out", () => {
		expect(nullableBooleanAndYesNo.inputSchema.parse(null)).toBeNull();
		expect(() => nullableBooleanAndYesNo.inputSchema.parse(undefined)).toThrow();
		expect(nullableBooleanAndYesNo.outputSchema.parse(undefined)).toBeUndefined();
	});
});

describe("stringAndNullish", () => {
	test("preserves the default-empty-string behavior", () => {
		expect(stringAndNullish.fromInput(undefined)).toBe("");
		expect(stringAndNullish.fromOutput("")).toBeUndefined();
		expect(nullishStringAndString.fromInput("")).toBeUndefined();
		expect(nullishStringAndString.fromOutput(undefined)).toBe("");
	});
});
