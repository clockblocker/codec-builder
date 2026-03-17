import { describe, expect, test } from "bun:test";
import {
	dateAndIsoString,
	isoStringAndDate,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/date-and-iso-string-date";
import {
	nullableDateAndNullishIsoString,
	nullishIsoStringAndNullableDate,
} from "../src/codec-builders/strict-field-adapter/field-codecs/molecules/date-and-iso-string-date";
import {
	nullishStringAndString,
	stringAndNullish,
} from "../src/codec-builders/strict-field-adapter/field-codecs/molecules/nullish-string-and-emptiable-string";
import {
	numberAndNumericString,
	numericStringAndNumber,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/numeric-string-and-nullish-number";
import {
	nullableNumericStringAndNullishNumber,
	nullishNumberAndNullableNumericString,
	numberAndNullishNumericString,
} from "../src/codec-builders/strict-field-adapter/field-codecs/molecules/numeric-string-and-number";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "../src/codec-builders/strict-field-adapter/field-codecs/atoms/yes-no-and-boolean";
import {
	nullableYesNoAndNullishBoolean,
	nullishBooleanAndNullableYesNo,
} from "../src/codec-builders/strict-field-adapter/field-codecs/molecules/yes-no-and-boolean";

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

describe("nullableNumericStringAndNullishNumber", () => {
	test("maps nullish input to null and uses a nullable output schema", () => {
		expect(
			nullableNumericStringAndNullishNumber.fromInput(undefined),
		).toBeNull();
		expect(nullableNumericStringAndNullishNumber.fromInput(null)).toBeNull();
		expect(
			nullableNumericStringAndNullishNumber.outputSchema.parse(null),
		).toBeNull();
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

describe("dateAndIsoString", () => {
	test("uses strict non-nullable schemas in both directions", () => {
		const date = dateAndIsoString.fromInput("2024-01-01");
		expect(date).toBeInstanceOf(Date);
		expect(isoStringAndDate.fromInput(date)).toBe("2024-01-01T00:00:00.000Z");
		expect(() => dateAndIsoString.inputSchema.parse(undefined)).toThrow();
		expect(() => isoStringAndDate.inputSchema.parse(undefined)).toThrow();
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

describe("yesNoAndBoolean", () => {
	test("uses strict non-nullable schemas in both directions", () => {
		expect(yesNoAndBoolean.fromInput(true)).toBe("Yes");
		expect(booleanAndYesNo.fromInput("No")).toBe(false);
		expect(() => yesNoAndBoolean.inputSchema.parse(undefined)).toThrow();
		expect(() => booleanAndYesNo.inputSchema.parse(undefined)).toThrow();
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

describe("stringAndNullish", () => {
	test("preserves the default-empty-string behavior", () => {
		expect(stringAndNullish.fromInput(undefined)).toBe("");
		expect(stringAndNullish.fromOutput("")).toBeUndefined();
		expect(nullishStringAndString.fromInput("")).toBeUndefined();
		expect(nullishStringAndString.fromOutput(undefined)).toBe("");
	});
});
