import type { Schema } from "effect";

export type NoOpCodec = {
	readonly __noOpCodec: true;
};

/**
 * An Effect schema that decodes `TEncoded` into `TType`. Every `fieldCodec`
 * entry and any schema with matching types is assignable to it; decoding and
 * encoding services are left open.
 */
export type Codec<TType = unknown, TEncoded = unknown> = Schema.Codec<
	TType,
	TEncoded,
	unknown,
	unknown
>;

/** A struct schema, the kind of source the builders take. */
export type AnyStruct = Schema.Struct<Schema.Struct.Fields>;

/**
 * A default value, or a function that returns one. A function is called on
 * every decode that needs the default, so `() => new Date()` is "now" at
 * decode time and `() => []` is a fresh array each time. To default to a
 * function value, wrap it: `() => myFunction`.
 */
export type DefaultValue<T> = T | (() => T);

/** Flattens intersections/aliases so hovers show the resolved object. */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};
