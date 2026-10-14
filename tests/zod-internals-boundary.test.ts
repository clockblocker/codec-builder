import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

// Zod internals (`_zod`, `_def`) may only be touched in one module, so a
// Zod change has one place to fix and tests/zod-internals.test.ts pins it.
const allowed = new Set(["src/core/zod-internals.ts"]);
const root = new URL("..", import.meta.url).pathname;

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return entry.name.endsWith(".ts") ? [path] : [];
	});
}

test("only src/core/zod-internals.ts touches _zod or _def", () => {
	const offenders = sourceFiles(join(root, "src"))
		.map((path) => relative(root, path))
		.filter((path) => !allowed.has(path))
		.flatMap((path) =>
			readFileSync(join(root, path), "utf8")
				.split("\n")
				.map((line, index) => ({ path, line: index + 1, text: line }))
				.filter(({ text }) => /\b_zod\b|\b_def\b/.test(text)),
		)
		.map(({ path, line, text }) => `${path}:${line}: ${text.trim()}`);
	expect(offenders).toEqual([]);
});
