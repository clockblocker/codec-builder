import { expect, test } from "bun:test";
import { resolve } from "node:path";

const pkg = await Bun.file(resolve(import.meta.dir, "../package.json")).json();

test("every code export has a default condition so require() resolves", () => {
	for (const [subpath, target] of Object.entries(pkg.exports)) {
		if (subpath === "./package.json") continue;
		const conditions = target as Record<string, string>;
		expect(Object.keys(conditions)).toEqual(["types", "import", "default"]);
		expect(conditions.default).toBe(conditions.import);
	}
	expect(Object.keys(pkg.exports)).toEqual([
		".",
		"./v4",
		"./effect4",
		"./package.json",
	]);
});

test("package metadata", async () => {
	expect(pkg.version).toBe("0.5.0");
	expect(pkg.license).toBe("MIT");
	expect(pkg.repository.url).toBe(
		"git+https://github.com/clockblocker/codec-builder.git",
	);
	expect(pkg.peerDependencies).toEqual({ effect: "^4.0.0", zod: "^4.4.0" });
	// Each entry point needs only its own library: zod for the root and /v4,
	// effect for /effect4.
	expect(pkg.peerDependenciesMeta).toEqual({
		effect: { optional: true },
		zod: { optional: true },
	});
	expect(
		await Bun.file(resolve(import.meta.dir, "../LICENSE")).exists(),
	).toBeTrue();
});

test("relative imports in src carry a .js extension for node16/nodenext consumers", async () => {
	const glob = new Bun.Glob("src/**/*.ts");
	const offenders: string[] = [];
	for await (const file of glob.scan(resolve(import.meta.dir, ".."))) {
		const text = await Bun.file(
			resolve(import.meta.dir, "..", file),
		).text();
		for (const match of text.matchAll(
			/(?:from|import)\s+"(\.{1,2}\/[^"]*)"/g,
		)) {
			if (!match[1]?.endsWith(".js"))
				offenders.push(`${file}: ${match[1]}`);
		}
	}
	expect(offenders).toEqual([]);
});
