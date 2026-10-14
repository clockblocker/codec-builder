import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Equal, Expect } from "./type-helpers";

const c = codecBuilder.fieldCodec;
const yesNo = c.nonNullish.boolean.and.yesNo;
const vip = z.enum(["Yes", "No"]);
// Zod types a catchall as an index signature that the named keys must fit
// too, so the catchall covers both sides of `vip`.
const scalar = z.union([z.string(), z.number(), z.boolean()]);

const strict = codecBuilder.buildStrictFieldAdapterCodec(
	z.strictObject({ vip }),
	{ vip: yesNo },
);
const loose = codecBuilder.buildStrictFieldAdapterCodec(
	z.object({ vip }).passthrough(),
	{ vip: yesNo },
);
const stripped = codecBuilder.buildStrictFieldAdapterCodec(
	z.object({ vip }).passthrough().strip(),
	{ vip: yesNo },
);
const caught = codecBuilder.buildStrictFieldAdapterCodec(
	z.object({ vip }).catchall(scalar),
	{ vip: yesNo },
);
const nested = codecBuilder.buildStrictFieldAdapterCodec(
	z.object({
		inner: z.strictObject({ vip }),
		meta: z.looseObject({ vip }).nullable(),
		rows: z.array(z.object({ vip }).catchall(scalar)),
	}),
	{
		inner: { vip: yesNo },
		meta: { vip: yesNo },
		rows: c.arrayOf({ vip: yesNo }),
	},
);

// The derived types are what Zod infers for the same policy.
const vipBool = { vip: z.boolean() };
type _strict = Expect<
	Equal<
		z.output<typeof strict>,
		z.output<ReturnType<typeof z.strictObject<typeof vipBool>>>
	>
>;
const looseOut = z.looseObject(vipBool);
type _loose = Expect<Equal<z.output<typeof loose>, z.output<typeof looseOut>>>;
type _looseIn = Expect<
	Equal<z.input<typeof loose.out>, z.input<typeof looseOut>>
>;
const caughtOut = z.object(vipBool).catchall(scalar);
type _catchall = Expect<
	Equal<z.output<typeof caught>, z.output<typeof caughtOut>>
>;
const nestedOut = z.object({
	inner: z.strictObject(vipBool),
	meta: z.looseObject(vipBool).nullable(),
	rows: z.array(z.object(vipBool).catchall(scalar)),
});
type _nested = Expect<
	Equal<z.output<typeof nested>, z.output<typeof nestedOut>>
>;

describe("unknown-key policy carries over to out", () => {
	test("strictObject stays strict", () => {
		expect(strict.out.safeParse({ vip: true }).success).toBeTrue();
		expect(
			strict.out.safeParse({ vip: true, extra: 1 }).success,
		).toBeFalse();
		expect(
			strict.safeEncode({ vip: true, extra: 1 } as never).success,
		).toBeFalse();
	});

	test("passthrough keys survive a round trip", () => {
		const decoded = loose.decode({ vip: "Yes", extra: 1, note: "n" });
		expect(decoded).toEqual({ vip: true, extra: 1, note: "n" });
		expect(loose.encode(decoded)).toEqual({
			vip: "Yes",
			extra: 1,
			note: "n",
		});
		expect(loose.out.parse({ vip: true, extra: 1 })).toEqual({
			vip: true,
			extra: 1,
		});
	});

	test(".strip() strips", () => {
		expect(stripped.decode({ vip: "No", extra: 1 } as never)).toEqual({
			vip: false,
		});
		expect(stripped.out.parse({ vip: false, extra: 1 })).toEqual({
			vip: false,
		});
	});

	test("catchall keeps validated extra keys", () => {
		expect(caught.decode({ vip: "No", n: 2 })).toEqual({
			vip: false,
			n: 2,
		});
		expect(caught.encode({ vip: false, n: 2 })).toEqual({
			vip: "No",
			n: 2,
		});
		expect(
			caught.out.safeParse({ vip: false, n: null }).success,
		).toBeFalse();
	});

	test("nested objects keep their own policy", () => {
		const input = {
			inner: { vip: "Yes" as const },
			meta: { vip: "No" as const, source: "import" },
			rows: [{ vip: "Yes" as const, label: "a" }],
		};
		const decoded = nested.decode(input);
		expect(decoded).toEqual({
			inner: { vip: true },
			meta: { vip: false, source: "import" },
			rows: [{ vip: true, label: "a" }],
		});
		expect(nested.encode(decoded)).toEqual(input);
		expect(
			nested.out.safeParse({ ...decoded, inner: { vip: true, x: 1 } })
				.success,
		).toBeFalse();
		expect(
			nested.out.safeParse({ ...decoded, rows: [{ vip: true, n: null }] })
				.success,
		).toBeFalse();
	});
});
