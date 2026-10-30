import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";
import { encodeIssues } from "./issues";

const canonicalSchema = Schema.Struct({
	language: Schema.Literal("de"),
	family: Schema.Literals(["Lexeme", "Phraseme"]),
	kind: Schema.Literal("NOUN"),
	canonicalForm: Schema.NonEmptyString,
	coreFeatures: Schema.Struct({
		gender: Schema.Literals(["Fem", "Masc", "Neut"]),
	}),
});

const codec = codecBuilder.buildFixedFieldsCodec(canonicalSchema, {
	language: "de",
	family: "Lexeme",
	kind: "NOUN",
});

type ModelValue = typeof codec.Encoded;
type CanonicalValue = typeof codec.Type;

type _model = Expect<
	Equal<
		ModelValue,
		{
			readonly canonicalForm: string;
			readonly coreFeatures: {
				readonly gender: "Fem" | "Masc" | "Neut";
			};
		}
	>
>;
type _canonical = Expect<Equal<CanonicalValue, typeof canonicalSchema.Type>>;
type _to = Expect<Equal<typeof codec.to, typeof canonicalSchema>>;

const modelValue = {
	canonicalForm: "Bank",
	coreFeatures: { gender: "Fem" },
} satisfies ModelValue;

const canonicalValue = {
	language: "de",
	family: "Lexeme",
	kind: "NOUN",
	canonicalForm: "Bank",
	coreFeatures: { gender: "Fem" },
} satisfies CanonicalValue;

// @ts-expect-error fixed fields are absent from the inferred model type
const modelValueWithLanguage: ModelValue = { ...modelValue, language: "de" };
// @ts-expect-error the inferred canonical type still requires fixed fields
const canonicalValueWithoutLanguage: CanonicalValue = modelValue;

function typeErrors(): void {
	// @ts-expect-error fixed field names must belong to the canonical schema
	codecBuilder.buildFixedFieldsCodec(canonicalSchema, { locale: "de" });
	// @ts-expect-error fixed field values must match their canonical field types
	codecBuilder.buildFixedFieldsCodec(canonicalSchema, { language: "en" });
}

const strict = { onExcessProperty: "error" } as const;

describe("buildFixedFieldsCodec (Effect 4)", () => {
	test("decodes, encodes, and round-trips multiple fixed fields", () => {
		expect(codec.to).toBe(canonicalSchema);
		expect(Object.keys(codec.from.fields)).toEqual([
			"canonicalForm",
			"coreFeatures",
		]);
		expect(Schema.decodeSync(codec)(modelValue)).toEqual(canonicalValue);
		expect(Schema.encodeSync(codec)(canonicalValue)).toEqual(modelValue);
		expect(
			Schema.decodeSync(codec)(Schema.encodeSync(codec)(canonicalValue)),
		).toEqual(canonicalValue);
	});

	test("both directions validate, and reject excess keys when asked to", () => {
		expect(() =>
			Schema.decodeUnknownSync(codec)({
				...modelValue,
				canonicalForm: "",
			}),
		).toThrow(Schema.SchemaError);
		expect(() =>
			Schema.decodeUnknownSync(codec)(
				{ ...modelValue, unexpected: true },
				strict,
			),
		).toThrow(Schema.SchemaError);
		expect(() =>
			Schema.encodeUnknownSync(codec)(
				{ ...canonicalValue, unexpected: true },
				strict,
			),
		).toThrow(Schema.SchemaError);
	});

	test("rejects a canonical value whose fixed field does not match", () => {
		expect(
			encodeIssues(codec, { ...canonicalValue, family: "Phraseme" }),
		).toEqual([
			{
				path: ["family"],
				message: 'Fixed field does not equal "Lexeme"',
			},
		]);
		expect(() =>
			Schema.encodeSync(codec)({ ...canonicalValue, family: "Phraseme" }),
		).toThrow(Schema.SchemaError);
	});

	test("validates configured fixed values when building the codec", () => {
		expect(() =>
			codecBuilder.buildFixedFieldsCodec(canonicalSchema, {
				language: "en",
			} as never),
		).toThrow(Schema.SchemaError);
		expect(() =>
			codecBuilder.buildFixedFieldsCodec(canonicalSchema, {
				locale: "de",
			} as never),
		).toThrow(/unknown field "locale"/);
	});

	test("fixed values are given encoded and compared as encoded", () => {
		const versioned = codecBuilder.buildFixedFieldsCodec(
			Schema.Struct({
				version: Schema.NumberFromString,
				id: Schema.String,
			}),
			{ version: "1.0" },
		);
		type _versioned = [
			Expect<Equal<typeof versioned.Encoded, { readonly id: string }>>,
			Expect<
				Equal<
					typeof versioned.Type,
					{ readonly version: number; readonly id: string }
				>
			>,
		];
		expect(Schema.decodeSync(versioned)({ id: "a" })).toEqual({
			version: 1,
			id: "a",
		});
		expect(Schema.encodeSync(versioned)({ version: 1, id: "a" })).toEqual({
			id: "a",
		});
		expect(() =>
			Schema.encodeSync(versioned)({ version: 2, id: "a" }),
		).toThrow(/does not equal "1"/);
	});

	test("works as a nested codec", () => {
		const requestCodec = Schema.Struct({
			markedContext: Schema.String,
			lemma: codec,
		});
		const modelRequest = {
			markedContext: "Die <TARGET>Bank</TARGET>",
			lemma: modelValue,
		};
		const canonicalRequest = {
			markedContext: "Die <TARGET>Bank</TARGET>",
			lemma: canonicalValue,
		};

		expect(Schema.decodeSync(requestCodec)(modelRequest)).toEqual(
			canonicalRequest,
		);
		expect(Schema.encodeSync(requestCodec)(canonicalRequest)).toEqual(
			modelRequest,
		);
	});
});

void modelValueWithLanguage;
void canonicalValueWithoutLanguage;
void typeErrors;
