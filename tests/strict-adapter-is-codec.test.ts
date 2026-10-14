import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";

const build = codecBuilder.buildStrictFieldAdapterCodec;
const row = z.object({ a: z.string() });

describe("only real codecs count as codecs", () => {
	test("a plain pipe is a type error and a readable runtime error", () => {
		const plainPipe = () =>
			build(row, {
				// @ts-expect-error a pipe has no encode direction
				a: z.string().pipe(z.string()),
			});
		expect(plainPipe).toThrow(
			'Codec shape entry "a" is a Zod schema but not a codec.',
		);
	});

	test("a transform pipe is rejected the same way", () => {
		const transformPipe = () =>
			build(row, { a: z.string().transform((v) => v.length) as never });
		expect(transformPipe).toThrow(
			'Codec shape entry "a" is a Zod schema but not a codec.',
		);
	});

	test("nested entries name their path", () => {
		const nested = () =>
			build(z.object({ rows: z.array(z.object({ a: z.string() })) }), {
				rows: codecBuilder.fieldCodec.arrayOf({
					a: z.string().pipe(z.string()) as never,
				}),
			});
		expect(nested).toThrow(
			'Codec shape entry "rows[].a" is a Zod schema but not a codec.',
		);
	});

	test("z.codec, z.stringbool and z.invertCodec are codecs", () => {
		const codec = build(
			z.object({ a: z.string(), b: z.string(), c: z.boolean() }),
			{
				a: z.codec(z.string(), z.number(), {
					decode: Number,
					encode: String,
				}),
				b: z.stringbool(),
				c: z.invertCodec(z.stringbool()),
			},
		);
		expect(codec.decode({ a: "1", b: "yes", c: false })).toEqual({
			a: 1,
			b: true,
			c: "false",
		});
	});
});
