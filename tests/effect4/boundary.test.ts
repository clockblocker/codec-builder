import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

// The Zod and Effect entry points stay independent, so each one works with
// only its own peer dependency installed: src/effect4 imports nothing but
// `effect` and its own modules, and nothing else in src imports `effect` or
// src/effect4.
const root = resolve(import.meta.dir, "../..");
const effectDir = join(root, "src/effect4");

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return entry.name.endsWith(".ts") ? [path] : [];
	});
}

function importsOf(path: string): string[] {
	const text = readFileSync(path, "utf8");
	return [...text.matchAll(/(?:from|import)\s*\(?\s*"([^"]+)"/g)].flatMap(
		(match) => (match[1] === undefined ? [] : [match[1]]),
	);
}

const isEffect = (specifier: string) =>
	specifier === "effect" || specifier.startsWith("effect/");

describe("entry point boundary", () => {
	const files = sourceFiles(join(root, "src"));

	test("src/effect4 imports only effect and its own modules", () => {
		const offenders = files
			.filter((path) => path.startsWith(effectDir))
			.flatMap((path) =>
				importsOf(path)
					.filter((specifier) =>
						specifier.startsWith(".")
							? !resolve(dirname(path), specifier).startsWith(
									effectDir,
								)
							: !isEffect(specifier),
					)
					.map(
						(specifier) => `${relative(root, path)}: ${specifier}`,
					),
			);
		expect(offenders).toEqual([]);
	});

	test("the Zod entry points import neither effect nor src/effect4", () => {
		const offenders = files
			.filter((path) => !path.startsWith(effectDir))
			.flatMap((path) =>
				importsOf(path)
					.filter((specifier) =>
						specifier.startsWith(".")
							? resolve(dirname(path), specifier).startsWith(
									effectDir,
								)
							: isEffect(specifier),
					)
					.map(
						(specifier) => `${relative(root, path)}: ${specifier}`,
					),
			);
		expect(offenders).toEqual([]);
	});

	test("the bundles reference only their own library", async () => {
		const bundle = async (entrypoint: string) => {
			const build = await Bun.build({
				entrypoints: [join(root, entrypoint)],
				format: "esm",
				packages: "external",
				target: "node",
			});
			expect(build.success).toBeTrue();
			return (await build.outputs[0]?.text()) ?? "";
		};

		const effect4 = await bundle("src/effect4/index.ts");
		expect(effect4).toContain('from "effect"');
		expect(effect4).not.toContain("zod");

		for (const entrypoint of ["src/index.ts", "src/v4/index.ts"]) {
			const zod = await bundle(entrypoint);
			expect(zod).toContain("zod/v4");
			expect(zod).not.toMatch(/from\s*"effect/);
		}
	});
});
