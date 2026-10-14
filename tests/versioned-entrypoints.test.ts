import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { z } from "zod/v3";
import * as root from "../src";
import { codecBuilder3 } from "../src/v3";

describe("entrypoints", () => {
	test("exposes the Zod 3 interface", () => {
		const codec =
			codecBuilder3.fieldCodec.nonNullish.numericString.and.number;

		expect(codec.inputSchema).toBeInstanceOf(z.ZodNumber);
		expect(codec.fromInput(42)).toBe("42");
		expect(codec.fromOutput("42.5")).toBe(42.5);
	});

	test("root and /v3 export the same builder", () => {
		expect(root.codecBuilder3).toBe(codecBuilder3);
		expect(Object.keys(root)).toEqual(["codecBuilder3"]);
	});

	test("bundles root and /v3 against zod/v3 only", async () => {
		const packageRoot = resolve(import.meta.dir, "..");
		const builds = await Promise.all(
			["src/v3/index.ts", "tests/fixtures/import-v3-from-root.ts"].map(
				(entry) =>
					Bun.build({
						entrypoints: [resolve(packageRoot, entry)],
						format: "esm",
						packages: "external",
						target: "node",
					}),
			),
		);

		for (const build of builds) {
			expect(build.success).toBeTrue();
			const bundle = (await build.outputs[0]?.text()) ?? "";
			expect(bundle).toContain("zod/v3");
			expect(bundle).not.toContain("zod/v4");
		}
	});
});
