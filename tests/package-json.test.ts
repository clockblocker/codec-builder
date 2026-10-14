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
	expect(Object.keys(pkg.exports)).toEqual([".", "./v4", "./package.json"]);
});

test("package metadata", async () => {
	expect(pkg.version).toBe("0.4.0");
	expect(pkg.license).toBe("MIT");
	expect(pkg.repository.url).toBe(
		"git+https://github.com/clockblocker/codec-builder.git",
	);
	expect(pkg.peerDependencies).toEqual({ zod: "^4.4.0" });
	expect(
		await Bun.file(resolve(import.meta.dir, "../LICENSE")).exists(),
	).toBeTrue();
});
