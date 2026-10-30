import { rm } from "node:fs/promises";

await rm("./dist", { force: true, recursive: true });

const result = await Bun.build({
	entrypoints: [
		"./src/index.ts",
		"./src/v4/index.ts",
		"./src/effect4/index.ts",
	],
	external: ["zod", "zod/*", "effect", "effect/*"],
	format: "esm",
	outdir: "./dist",
	root: "./src",
	sourcemap: "external",
	splitting: true,
	target: "browser",
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}

	process.exit(1);
}
