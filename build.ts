import { rm } from "node:fs/promises";

await rm("./dist", { force: true, recursive: true });

const result = await Bun.build({
	entrypoints: ["./src/index.ts"],
	external: ["zod"],
	format: "esm",
	outdir: "./dist",
	sourcemap: "external",
	target: "browser",
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}

	process.exit(1);
}
