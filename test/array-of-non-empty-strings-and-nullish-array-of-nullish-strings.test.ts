import { describe, expect, test } from "bun:test";

import {
	arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings,
	nullishArrayOfNullishStringsAndArrayOfNonEmptyStrings,
} from "../src/field-codecs/molecules/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";

describe("arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings", () => {
	test("normalizes nullish arrays to an empty array", () => {
		expect(
			arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings.fromInput(
				undefined,
			),
		).toEqual([]);
		expect(
			arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings.fromInput(null),
		).toEqual([]);
	});

	test("drops nullish and empty string items", () => {
		expect(
			arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings.fromInput([
				"a",
				null,
				"",
				undefined,
				"b",
			]),
		).toEqual(["a", "b"]);
	});

	test("keeps non-empty strings when converting back", () => {
		expect(
			arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings.fromOutput([
				"a",
				"b",
			]),
		).toEqual(["a", "b"]);
	});

	test("uses non-empty strings in the output schema", () => {
		expect(() =>
			arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings.outputSchema.parse([
				"",
			]),
		).toThrow();
		expect(
			arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings.outputSchema.parse([
				"a",
			]),
		).toEqual(["a"]);
	});
});

describe("nullishArrayOfNullishStringsAndArrayOfNonEmptyStrings", () => {
	test("filters nullish and empty values on fromOutput", () => {
		expect(
			nullishArrayOfNullishStringsAndArrayOfNonEmptyStrings.fromOutput([
				"a",
				null,
				"",
				undefined,
			]),
		).toEqual(["a"]);
	});
});
