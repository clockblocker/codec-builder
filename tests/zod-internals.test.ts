import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import {
	codecTransforms,
	innerTypeOf,
	isCodec,
	isZodSchema,
	objectCatchall,
	pipeOut,
	schemaType,
} from "../src/core/zod-internals";

// Pins the Zod internals the library relies on (all reads go through
// src/core/zod-internals.ts). If one of these fails after a Zod upgrade,
// that module needs updating.

describe("zod internals the library relies on", () => {
	test("codecs are pipes with both transforms; other pipes are not codecs", () => {
		const codec = z.codec(z.string(), z.number(), {
			decode: Number,
			encode: String,
		});
		expect(isCodec(codec)).toBeTrue();
		expect(isCodec(z.stringbool())).toBeTrue();
		expect(isCodec(z.invertCodec(codec))).toBeTrue();
		expect(isCodec(z.string().pipe(z.string()))).toBeFalse();
		expect(isCodec(z.string().transform(Number))).toBeFalse();
		expect(
			isCodec({ in: 1, out: 2, decode() {}, encode() {} }),
		).toBeFalse();

		const { transform, reverseTransform } = codecTransforms(codec);
		const payload = { value: "1", issues: [] };
		expect(transform("2", payload)).toBe(2);
		expect(reverseTransform(3, payload)).toBe("3");
	});

	test("schema types, wrappers and pipe sides", () => {
		const inner = z.string();
		expect(schemaType(inner)).toBe("string");
		expect(schemaType(inner.optional())).toBe("optional");
		expect(schemaType(inner.nullable())).toBe("nullable");
		expect(schemaType(z.object({}))).toBe("object");
		expect(schemaType(z.array(inner))).toBe("array");
		expect(schemaType(inner.transform(Number))).toBe("pipe");
		expect(schemaType(z.transform(Number))).toBe("transform");
		expect(schemaType(z.preprocess(String, inner))).toBe("pipe");
		for (const wrapped of [
			inner.default("x"),
			inner.prefault("x"),
			inner.catch("x"),
		]) {
			expect(innerTypeOf(wrapped)).toBe(inner);
		}
		const enumSchema = z.enum(["a"]);
		expect(pipeOut(inner.pipe(enumSchema))).toBe(enumSchema);
		expect(pipeOut(z.stringbool())).toBeInstanceOf(z.ZodBoolean);
		expect(isZodSchema(inner)).toBeTrue();
		expect(isZodSchema({})).toBeFalse();
	});

	test("an object's unknown-key policy is its catchall", () => {
		const shape = { a: z.string() };
		expect(objectCatchall(z.object(shape))).toBeUndefined();
		expect(objectCatchall(z.object(shape).strip())).toBeUndefined();
		expect(objectCatchall(z.strictObject(shape))).toBeInstanceOf(
			z.ZodNever,
		);
		expect(objectCatchall(z.looseObject(shape))).toBeInstanceOf(
			z.ZodUnknown,
		);
		expect(
			objectCatchall(z.object(shape).catchall(z.number())),
		).toBeInstanceOf(z.ZodNumber);
	});
});
