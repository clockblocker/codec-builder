import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { z } from "zod/v4";
import * as root from "../src";
import * as v4 from "../src/v4";
import type { Expect } from "./type-helpers";

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;

// The unsuffixed root type names are the Zod 4 types, and the `4`-suffixed
// names and the `/v4` subpath are aliases of them.
type _rootTypes = [
	Expect<
		Equal<
			root.ShapeOfStrictFieldAdapter4<{ a: 1 }>,
			root.ShapeOfStrictFieldAdapter<{ a: 1 }>
		>
	>,
	Expect<
		Equal<
			root.ShapeOfStrictFieldAdapterCodec4<{ a: 1 }>,
			root.ShapeOfStrictFieldAdapterCodec<{ a: 1 }>
		>
	>,
	Expect<
		Equal<
			v4.ShapeOfStrictFieldAdapter<{ a: 1 }>,
			root.ShapeOfStrictFieldAdapter<{ a: 1 }>
		>
	>,
	Expect<Equal<v4.Codec<string, number>, root.Codec<string, number>>>,
];

const _fieldCodecIsCodec: root.Codec<string, number> =
	root.codecBuilder.fieldCodec.nonNullish.numericString.and.number;

describe("entrypoints", () => {
	test("root and /v4 export the same builder", () => {
		expect(root.codecBuilder4).toBe(root.codecBuilder);
		expect(v4.codecBuilder).toBe(root.codecBuilder);
		expect(v4.codecBuilder4).toBe(root.codecBuilder);
		expect(Object.keys(root).sort()).toEqual([
			"codecBuilder",
			"codecBuilder4",
		]);
	});

	test("builds and validates codecs with Zod 4 schemas", () => {
		const codec =
			root.codecBuilder.fieldCodec.nonNullish.numericString.and.number;

		expect(_fieldCodecIsCodec).toBe(codec as typeof _fieldCodecIsCodec);
		expect(codec.in).toBeInstanceOf(z.ZodNumber);
		expect(codec.decode(42)).toBe("42");
		expect(codec.encode("42.5")).toBe(42.5);

		const adapter = root.codecBuilder.buildStrictFieldAdapterCodec(
			z.object({
				id: z.number(),
				label: z.string(),
			}),
			{
				id: codec,
				label: root.codecBuilder.fieldCodec.noOp,
			},
		);

		expect(adapter.out.parse({ id: "42", label: "answer" })).toEqual({
			id: "42",
			label: "answer",
		});
		expect(adapter.decode({ id: 42, label: "answer" })).toEqual({
			id: "42",
			label: "answer",
		});
	});

	test("bundles the root and /v4 entrypoints against zod/v4 only", async () => {
		const packageRoot = resolve(import.meta.dir, "..");
		const builds = await Promise.all(
			[
				"src/index.ts",
				"src/v4/index.ts",
				"tests/fixtures/import-v4-from-root.ts",
			].map((entrypoint) =>
				Bun.build({
					entrypoints: [resolve(packageRoot, entrypoint)],
					format: "esm",
					packages: "external",
					target: "node",
				}),
			),
		);

		for (const build of builds) {
			expect(build.success).toBeTrue();
			const bundle = (await build.outputs[0]?.text()) ?? "";
			expect(bundle).toContain("zod/v4");
			expect(bundle).not.toContain("zod/v3");
		}
	});
});
