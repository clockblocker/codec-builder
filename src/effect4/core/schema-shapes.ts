import { Schema, SchemaAST } from "effect";

// Reads the shapes the builders work with (structs, arrays and the
// optional/nullable wrappers around them) through Effect's public schema
// properties: `fields`, `value`, `members`, `schema` and the AST guards.

type StructLike = Schema.Top & { readonly fields: Schema.Struct.Fields };
type ArrayLike = Schema.Top & { readonly value: Schema.Top };
type UnionLike = Schema.Top & { readonly members: readonly Schema.Top[] };
type OptionalKeyLike = Schema.Top & { readonly schema: Schema.Top };

/** A `Schema.Struct` (or a schema built on one) without index signatures. */
export function isStructSchema(schema: Schema.Top): schema is StructLike {
	return (
		SchemaAST.isObjects(schema.ast) &&
		schema.ast.indexSignatures.length === 0 &&
		"fields" in schema &&
		typeof schema.fields === "object" &&
		schema.fields !== null
	);
}

/** A `Schema.Array(item)`. */
export function isArraySchema(schema: Schema.Top): schema is ArrayLike {
	return (
		SchemaAST.isArrays(schema.ast) &&
		"value" in schema &&
		Schema.isSchema(schema.value)
	);
}

function isNullish(schema: Schema.Top): boolean {
	return SchemaAST.isNull(schema.ast) || SchemaAST.isUndefined(schema.ast);
}

/** `optionalKey(S)` or `optional(S)`; the latter wraps `UndefinedOr(S)`. */
function isOptionalKeyWrapper(schema: Schema.Top): schema is OptionalKeyLike {
	return (
		schema.ast.context?.isOptional === true &&
		"schema" in schema &&
		Schema.isSchema(schema.schema)
	);
}

/** `NullOr(S)`, `UndefinedOr(S)`, `NullishOr(S)`: one member that isn't. */
function nullishUnionInner(schema: Schema.Top): number | undefined {
	if (!SchemaAST.isUnion(schema.ast) || !("members" in schema)) {
		return undefined;
	}
	const members = (schema as UnionLike).members;
	const inner = members.flatMap((member, index) =>
		isNullish(member) ? [] : [index],
	);
	return inner.length === 1 && members.length > 1 ? inner[0] : undefined;
}

export type NullishWrapper =
	| { readonly kind: "optionalKey" }
	| {
			readonly kind: "union";
			readonly members: readonly Schema.Top[];
			readonly index: number;
	  };

/** Strips optional-key and nullish-union wrappers, outermost first. */
export function unwrapNullish(schema: Schema.Top): {
	inner: Schema.Top;
	wrappers: NullishWrapper[];
} {
	const wrappers: NullishWrapper[] = [];
	let inner = schema;
	for (;;) {
		if (isOptionalKeyWrapper(inner)) {
			wrappers.push({ kind: "optionalKey" });
			inner = inner.schema;
			continue;
		}
		const index = nullishUnionInner(inner);
		if (index === undefined) break;
		const members = (inner as UnionLike).members;
		wrappers.push({ kind: "union", members, index });
		inner = members[index] as Schema.Top;
	}
	return { inner, wrappers };
}

/** Puts `schema` back inside the wrappers `unwrapNullish` took off. */
export function rewrap(
	schema: Schema.Top,
	wrappers: readonly NullishWrapper[],
): Schema.Top {
	let result = schema;
	for (let i = wrappers.length - 1; i >= 0; i--) {
		const wrapper = wrappers[i] as NullishWrapper;
		result =
			wrapper.kind === "optionalKey"
				? Schema.optionalKey(result)
				: Schema.Union(
						wrapper.members.map((member, index) =>
							index === wrapper.index ? result : member,
						),
					);
	}
	return result;
}
