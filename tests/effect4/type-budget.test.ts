import { expect, test } from "bun:test";
import { DEFAULT_UTILITY_TYPES, expectTypes } from "typeprobe/testing";

// Type-checker budgets for the Effect 4 builders, counted by typeprobe the
// same way as tests/type-budget.test.ts. Budgets are the measured counts
// plus about 25%. If a change legitimately moves a count, re-measure and
// keep the headroom.

// Internal aliases that must never show up in a hover.
const internalAliases = [
	"ComposedFields",
	"ComposedField",
	"RewrapLike",
	"TypeSideFields",
	"CodecShapeForFields",
	"CodecShapeChecks",
	"OutputFields",
];

const fixture = new URL("../fixtures/effect4-type-budget.ts", import.meta.url);

test(
	"effect4 builder types stay within their instantiation budgets and readable",
	() => {
		const result = expectTypes(fixture, {
			compiler: "project",
			readable: {
				utilityTypes: [...DEFAULT_UTILITY_TYPES, ...internalAliases],
			},
			types: [
				// buildStrictFieldAdapterCodec
				{ name: "userCodec", maxInstantiations: 26_000 },
				{ name: "User", maxInstantiations: 27_500 },
				{ name: "UserRow", maxInstantiations: 27_500 },
				// buildReshapeCodec
				{ name: "personCodec", maxInstantiations: 20_500 },
				{ name: "Person", maxInstantiations: 20_500 },
			],
			maxInstantiations: 31_000,
		});

		expect(result.types).toHaveLength(5);
	},
	{ timeout: 120_000 },
);
