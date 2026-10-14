import { describe, expect, test } from "bun:test";
import { createRequire } from "node:module";
import { z } from "zod/v3";
import { codecBuilder3 as codecBuilder } from "../src/v3";

// zod's CommonJS build: what a require() consumer gets, a separate instance
// from the ESM "zod/v3" this library imports.
const requireCjs = createRequire(import.meta.url);
const { z: zCjs } = requireCjs("../node_modules/zod/v3/index.cjs") as {
	z: typeof z;
};

describe("schemas from a different Zod instance", () => {
	test("the CommonJS build is a separate instance", () => {
		expect(zCjs.ZodEnum).not.toBe(z.ZodEnum);
	});

	test("buildNullableUnionAndNullishString accepts a foreign z.enum", () => {
		const status = codecBuilder.helpers.buildNullableUnionAndNullishString(
			zCjs.enum(["draft", "published"]),
		);

		expect(status.fromInput("draft")).toBe("draft");
		expect(status.fromInput("archived")).toBeNull();
		expect(status.outputSchema.parse("published")).toBe("published");
	});

	test("buildStrictFieldAdapterCodec accepts a foreign z.object", () => {
		const c = codecBuilder.fieldCodec;
		const codec = codecBuilder.buildStrictFieldAdapterCodec(
			zCjs.object({
				n: zCjs.string(),
				nested: zCjs.object({ ok: zCjs.enum(["Yes", "No"]) }),
				list: zCjs.array(zCjs.string()),
			}),
			{
				n: c.nonNullish.number.and.numericString,
				nested: { ok: c.nonNullish.boolean.and.yesNo },
				list: c.arrayOf(c.noOp),
			},
		);

		expect(
			codec.fromInput({ n: "1.5", nested: { ok: "Yes" }, list: ["a"] }),
		).toEqual({ n: 1.5, nested: { ok: true }, list: ["a"] });
	});
});
