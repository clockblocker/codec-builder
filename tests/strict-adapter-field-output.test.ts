import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Equal, Expect } from "./type-helpers";

const c = codecBuilder.fieldCodec;
const build = codecBuilder.buildStrictFieldAdapterCodec;

// The source schema runs first, then the field codec decodes its output. So
// codecs are checked against the field's output type (after .default(),
// .catch(), preprocess and .transform()), not its input type.

const row = z.object({
	at: z.iso.datetime().default("2024-01-02T00:00:00.000Z"),
	num: z.string().catch("0"),
	pre: z.preprocess((value) => String(value), z.string()),
	len: z.string().transform((value) => value.length),
	// noOp fields: out must hold the decoded value, not re-run the source
	size: z.string().transform((value) => value.length),
	flag: z.stringbool(),
	opt: z.string().transform(Number).optional(),
});

const codec = build(row, {
	at: c.nonNullish.date.and.isoString,
	num: c.nonNullish.number.and.numericString,
	pre: c.nonNullish.number.and.numericString,
	len: c.nonNullish.numericString.and.number,
	size: c.noOp,
	flag: c.noOp,
	opt: c.noOp,
});

type _out = Expect<
	Equal<
		z.output<typeof codec>,
		{
			at: Date;
			num: number;
			pre: number;
			len: string;
			size: number;
			flag: boolean;
			opt?: number | undefined;
		}
	>
>;

const rejected = () => [
	build(z.object({ len: z.string().transform((value) => value.length) }), {
		// @ts-expect-error the codec gets the transformed number, not a string
		len: c.nonNullish.number.and.numericString,
	}),
	build(z.object({ n: z.preprocess(Number, z.number()) }), {
		// @ts-expect-error the codec gets the preprocessed number
		n: c.nonNullish.number.and.numericString,
	}),
	build(z.object({ n: z.number().default(1) }), {
		// @ts-expect-error a defaulted number is still a number
		n: c.nonNullish.number.and.numericString,
	}),
	build(z.object({ s: z.string().catch("x") }), {
		// @ts-expect-error a caught string is still a string
		s: c.nonNullish.numericString.and.number,
	}),
];

describe("field output types and decode order", () => {
	test("the source schema runs before the field codec", () => {
		const decoded = codec.decode({
			num: 5 as never,
			pre: 12 as never,
			len: "abc",
			size: "abcd",
			flag: "true",
		} as never);
		expect(decoded).toEqual({
			at: new Date("2024-01-02T00:00:00.000Z"),
			num: 0,
			pre: 12,
			len: "3",
			size: 4,
			flag: true,
		});
	});

	test("noOp fields validate the decoded value with the field's output side", () => {
		expect(codec.out.shape.flag.safeParse(true).success).toBeTrue();
		expect(codec.out.shape.flag.safeParse("true").success).toBeFalse();
		expect(
			codec.out.safeParse({
				at: new Date(),
				num: 1,
				pre: 1,
				len: "1",
				size: 4,
				flag: true,
			}).success,
		).toBeTrue();
	});

	test("a codec source field with noOp encodes back", () => {
		const flags = build(z.object({ flag: z.stringbool() }), {
			flag: c.noOp,
		});
		expect(flags.decode({ flag: "yes" })).toEqual({ flag: true });
		expect(flags.encode({ flag: true })).toEqual({ flag: "true" });
	});

	test("Zod cannot encode through a transform or preprocess", () => {
		const transformed = build(
			z.object({ len: z.string().transform((value) => value.length) }),
			{ len: c.nonNullish.numericString.and.number },
		);
		expect(() => transformed.encode({ len: "3" })).toThrow(
			z.core.$ZodEncodeError,
		);
	});

	test("the rejected pairings are type errors only", () => {
		expect(rejected).toBeFunction();
	});
});
