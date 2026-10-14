import { expect, test } from "bun:test";
import { expectTypes } from "typeprobe/testing";

// Type-checker budgets for each builder, counted by typeprobe on the
// project's own TypeScript (a fresh checker per count, so the numbers are
// deterministic). Every count includes about 103k instantiations for
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
				{ name: "userCodec", maxInstantiations: 138_000 },
				{ name: "User", maxInstantiations: 141_000 },
				// buildStrictFieldAdapter
				{ name: "apiUserAdapter", maxInstantiations: 130_000 },
				{ name: "AdaptedApiUser", maxInstantiations: 131_000 },
				// buildReshapeCodec
				{ name: "personCodec", maxInstantiations: 131_000 },
				{ name: "Person", maxInstantiations: 132_000 },
				// buildFixedFieldsCodec
				{ name: "lemmaCodec", maxInstantiations: 130_000 },
				{ name: "CompactLemma", maxInstantiations: 130_000 },
			],
			maxInstantiations: 146_000,
		});

		expect(result.types).toHaveLength(8);
	},
	{ timeout: 120_000 },
);
