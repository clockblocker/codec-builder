import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { codecBuilder } from "../src/index";


describe("codecBuilder.helpers", () => {
	const c = codecBuilder.fieldCodec;

	test("namespaces field codecs by value family and nullability", () => {
		expect(c.string.and.nullish).toBeDefined();
		expect(c.number.and.nullishNumericString).toBeDefined();
		expect(c.numericString.and.int).toBeDefined();
		expect(c.date.and.isoString).toBeDefined();
		expect(c.yesNo.and.boolean).toBeDefined();
		expect("emptiableStringAndNullishString" in c).toBeFalse();
		expect("numericStringAndInt" in c).toBeFalse();
	});

	test("namespaces helper builders under helpers", () => {
		expect(codecBuilder.helpers.toArrayOf).toBeDefined();
		expect(
			codecBuilder.helpers.toNullableOutputAndNullishInput,
		).toBeDefined();
		expect(
			codecBuilder.helpers.toNonNullishWithDefault,
		).toBeDefined();
		expect(
			codecBuilder.helpers.buildNullableUnionAndNullishString,
		).toBeDefined();
		expect(codecBuilder.helpers.buildFilteredNullishArrayCodec).toBeDefined();
		expect(codecBuilder.helpers.pipeCodecs).toBeDefined();

		expect("toArrayOf" in codecBuilder).toBeFalse();
		expect("toNullableOutputAndNullishInput" in codecBuilder).toBeFalse();
		expect(
			"toNonNullishWithDefault" in codecBuilder,
		).toBeFalse();
		expect("buildNullableUnionAndNullishString" in codecBuilder).toBeFalse();
		expect("buildFilteredNullishArrayCodec" in codecBuilder).toBeFalse();
		expect("pipeCodecs" in codecBuilder).toBeFalse();
	});

	test("exposes working helper builders through the nested helpers object", () => {
		const arrayOfCodec = codecBuilder.helpers.toArrayOf(
			c.string.and.nullish,
		);
		expect(arrayOfCodec.fromInput([undefined, "a", null])).toEqual([
			"",
			"a",
			"",
		]);
		expect(arrayOfCodec.fromOutput(["", "a"])).toEqual([undefined, "a"]);

		const nullableUnionCodec =
			codecBuilder.helpers.buildNullableUnionAndNullishString([
				"draft",
				"published",
			] as const);
		expect(nullableUnionCodec.fromInput(undefined)).toBeNull();
		expect(nullableUnionCodec.fromInput("draft")).toBe("draft");
		expect(nullableUnionCodec.fromInput("invalid")).toBeNull();

		const filteredArrayCodec =
			codecBuilder.helpers.buildFilteredNullishArrayCodec(
				z.string().nullish(),
				z.string().min(1),
			);
		expect(
			filteredArrayCodec.fromInput(["a", "", null, undefined, "b"]),
		).toEqual(["a", "b"]);

		const nullableWrappedCodec =
			codecBuilder.helpers.toNullableOutputAndNullishInput(
				c.numericString.and.int,
			);
		expect(nullableWrappedCodec.fromInput(undefined)).toBeNull();
		expect(nullableWrappedCodec.fromOutput(null)).toBeNull();
		expect(nullableWrappedCodec.fromInput(4)).toBe("4");

		const defaultedWrappedCodec =
			codecBuilder.helpers.toNonNullishWithDefault(
				nullableWrappedCodec,
				0,
			);
		expect(defaultedWrappedCodec.fromInput(4)).toBe("4");

		const liftedNumericStringCodec =
			codecBuilder.helpers.toNullableOutputAndNullishInput(
				c.numericString.and.number,
			);
		expect(liftedNumericStringCodec.fromInput(undefined)).toBeNull();
		expect(liftedNumericStringCodec.fromInput(4)).toBe("4");
		expect(liftedNumericStringCodec.outputSchema.parse(null)).toBeNull();

		const strictStringCodec =
			codecBuilder.helpers.toNonNullishWithDefault(
				{
					fromInput: (value: string | null | undefined) => value ?? null,
					fromOutput: (value: string | null) =>
						value == null || value === "" ? undefined : value,
					inputSchema: z.string().nullish(),
					outputSchema: z.string().nullable(),
				},
				"",
			);
		expect(strictStringCodec.fromInput("x")).toBe("x");
		expect(strictStringCodec.fromOutput("")).toBe("");
		expect(strictStringCodec.fromOutput("x")).toBe("x");
	});

	test("pipes codecs through the nested helpers object", () => {
		const numberToString = {
			fromInput: (value: number) => String(value),
			fromOutput: (value: string) => Number(value),
			inputSchema: z.number(),
			outputSchema: z.string(),
		};

		const stringToWrappedString = {
			fromInput: (value: string) => `[${value}]`,
			fromOutput: (value: string) => value.slice(1, -1),
			inputSchema: z.string(),
			outputSchema: z.string(),
		};

		const pipedCodec = codecBuilder.helpers.pipeCodecs(
			numberToString,
			stringToWrappedString,
		);

		expect(pipedCodec.fromInput(1234)).toBe("[1234]");
		expect(pipedCodec.fromOutput("[3]")).toBe(3);
		expect(pipedCodec.inputSchema.parse(5)).toBe(5);
		expect(pipedCodec.outputSchema.parse("[2]")).toBe("[2]");
	});
});
