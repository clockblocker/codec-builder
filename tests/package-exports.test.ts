import { describe, expect, test } from "bun:test";
import packageJson from "../package.json";

describe("package.json", () => {
	test("every subpath export has a default condition for require()", () => {
		for (const [subpath, target] of Object.entries(packageJson.exports)) {
			if (typeof target === "string") {
				continue;
			}
			expect(Object.keys(target), subpath).toEqual([
				"types",
				"import",
				"default",
			]);
			expect(target.default, subpath).toBe(target.import);
		}
	});

	test("exports only the root and /v3 entrypoints", () => {
		expect(Object.keys(packageJson.exports)).toEqual([
			".",
			"./v3",
			"./package.json",
		]);
	});

	test("declares zod 3 as the peer dependency, a repository and MIT", () => {
		expect(packageJson.peerDependencies.zod).toBe("^3.25.0");
		expect(packageJson.repository.url).toContain(
			"github.com/clockblocker/codec-builder",
		);
		expect(packageJson.license).toBe("MIT");
	});
});
