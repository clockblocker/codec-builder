import { expect, test } from "bun:test";
import { expectTypes } from "typeprobe/testing";

// Type-checker budgets for each builder, counted by typeprobe on the
// project's own TypeScript (a fresh checker per count, so the numbers are
// deterministic). Every count includes about 100k instantiations for
// resolving the field-codec modules from source; the rest is the builder.
// Budgets are the measured counts plus about 25%. If a change legitimately
// moves a count, re-measure and keep the headroom.
//
// `readable: true` fails when a printed type shows an unresolved utility
// type (Omit, Pick, ...) or an object intersection instead of the object.

const fixture = new URL("./fixtures/type-budget.ts", import.meta.url);

test(
	"builder types stay within their instantiation budgets and readable",
	() => {
		const result = expectTypes(fixture, {
			compiler: "project",
			readable: true,
			types: [
				// buildStrictFieldAdapterCodec
				{ name: "userCodec", maxInstantiations: 134_000 },
				{ name: "User", maxInstantiations: 137_000 },
				// buildStrictFieldAdapter
				{ name: "apiUserAdapter", maxInstantiations: 126_500 },
				{ name: "AdaptedApiUser", maxInstantiations: 126_500 },
				// buildReshapeCodec
				{ name: "personCodec", maxInstantiations: 127_500 },
				{ name: "Person", maxInstantiations: 128_000 },
				// buildFixedFieldsCodec
				{ name: "lemmaCodec", maxInstantiations: 126_000 },
				{ name: "CompactLemma", maxInstantiations: 126_500 },
			],
			maxInstantiations: 142_000,
		});

		expect(result.types).toHaveLength(8);
	},
	{ timeout: 120_000 },
);
