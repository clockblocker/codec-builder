/* eslint-disable @typescript-eslint/no-explicit-any -- Zod internals typing */
/** biome-ignore-all lint/suspicious/noExplicitAny: Zod internals typing */

// The only module that touches Zod internals (`_zod`, `_def`). Everything
// here is pinned by tests/zod-internals.test.ts, and
// tests/zod-internals-boundary.test.ts keeps `_zod` out of other modules.
// The shapes used are the same in Zod 4.4 through 4.6.

import { z } from "zod/v4";

// -- Types --

/** A schema's `def.type` ("string", "pipe", "optional", ...). */
export type DefTypeOf<TSchema extends z.core.$ZodType> =
	TSchema["_zod"]["def"]["type"];

/** A schema whose output side is optional, the way `z.object` reads it. */
export type OptionalOutputSchema = { _zod: { optout: "optional" } };

/** Whether `z.object` treats the schema's key as optional in the output. */
export type IsOptionalOutput<TSchema extends z.core.$ZodType> =
	TSchema["_zod"]["optout"] extends "optional" ? true : false;

/** The unknown-key policy (`$strip`, `$strict`, `$loose`, `$catchall<T>`). */
export type ObjectConfigOf<TSchema> = TSchema extends {
	_zod: { config: infer TConfig extends z.core.$ZodObjectConfig };
}
	? TConfig
	: z.core.$strip;

/** The output type of a codec's `in` schema. */
export type CodecInOutputOf<TCodec> = TCodec extends {
	_zod: { def: { in: { _zod: { output: infer TOutput } } } };
}
	? TOutput
	: never;

// -- Reading schemas --

type WithInternals = {
	_zod?: { def?: Record<string, unknown> };
	_def?: { type?: unknown };
};

function defOf(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null
		? (value as WithInternals)._zod?.def
		: undefined;
}

/**
 * Every Zod 4 schema has decode/encode methods and every pipe has `in` and
 * `out`, so only the def tells a codec apart: z.codec (and z.stringbool,
 * z.invertCodec) put both transforms on a pipe def.
 */
export function isCodec(value: unknown): value is z.ZodCodec {
	const def = defOf(value);
	return (
		def?.type === "pipe" &&
		typeof def.transform === "function" &&
		typeof def.reverseTransform === "function"
	);
}

/** A Zod schema from any copy of Zod (structural, not instanceof). */
export function isZodSchema(value: unknown): value is z.ZodTypeAny {
	return (
		typeof value === "object" &&
		value !== null &&
		"_def" in value &&
		"safeParse" in value &&
		typeof (value as { safeParse?: unknown }).safeParse === "function"
	);
}

/** The schema's `def.type`, read from `_def` so look-alike objects work. */
export function schemaType(schema: unknown): string | undefined {
	if (typeof schema !== "object" || schema === null) return undefined;
	const type = (schema as WithInternals)._def?.type;
	return typeof type === "string" ? type : undefined;
}

/** A pipe's (or codec's) `out` schema. */
export function pipeOut(schema: unknown): z.ZodTypeAny | undefined {
	return defOf(schema)?.out as z.ZodTypeAny | undefined;
}

/** The inner schema of a default, prefault or catch. */
export function innerTypeOf(schema: unknown): z.ZodTypeAny | undefined {
	return defOf(schema)?.innerType as z.ZodTypeAny | undefined;
}

/** An object's catchall: never for strict, unknown for loose, none for strip. */
export function objectCatchall(schema: unknown): z.ZodTypeAny | undefined {
	return defOf(schema)?.catchall as z.ZodTypeAny | undefined;
}

// -- Codec transforms --

export type CodecTransform = (
	value: unknown,
	payload: z.core.ParsePayload<unknown>,
) => unknown;

/** A codec's decode and encode functions, without its schemas. */
export function codecTransforms(codec: z.core.$ZodType): {
	transform: CodecTransform;
	reverseTransform: CodecTransform;
} {
	const def = defOf(codec);
	return {
		transform: def?.transform as CodecTransform,
		reverseTransform: def?.reverseTransform as CodecTransform,
	};
}

// -- Running schemas --

export type Direction = "decode" | "encode";

/** "sync" throws on an async step; "maybe-async" returns a Promise then. */
export type AsyncMode = "sync" | "maybe-async";

/** What a schema run returns: the value plus raw (unfinalized) issues. */
export type RunResult = z.core.ParsePayload<unknown>;

/**
 * Runs a schema the way an enclosing schema runs its children: issues stay
 * raw (with paths relative to `value`) so the caller can push them onto its
 * own payload, and the enclosing parse finalizes them with its context.
 *
 * "sync" passes `async: false` and throws Zod's `$ZodAsyncError` on any
 * async step, as a top-level sync parse does.
 * "maybe-async" leaves `async` unset, as Zod does for nested runs: the result
 * is a value while every step is sync and a Promise once one is async, and
 * each step runs once either way.
 */
export function runSchema(
	schema: z.core.$ZodType,
	value: unknown,
	direction: Direction,
	mode: "sync",
): RunResult;
export function runSchema(
	schema: z.core.$ZodType,
	value: unknown,
	direction: Direction,
	mode: AsyncMode,
): RunResult | Promise<RunResult>;
export function runSchema(
	schema: z.core.$ZodType,
	value: unknown,
	direction: Direction,
	mode: AsyncMode,
): RunResult | Promise<RunResult> {
	const ctx: { direction: "forward" | "backward"; async?: false } = {
		direction: direction === "decode" ? "forward" : "backward",
	};
	if (mode === "sync") ctx.async = false;
	const result = (
		schema as unknown as {
			_zod: {
				run(
					payload: RunResult,
					context: typeof ctx,
				): RunResult | Promise<RunResult>;
			};
		}
	)._zod.run({ value, issues: [] }, ctx);
	if (mode === "sync" && result instanceof Promise) {
		// Zod throws for async checks itself but hands back a Promise for an
		// async transform; a top-level sync parse turns that into this error.
		result.then(undefined, () => {});
		throw new z.core.$ZodAsyncError();
	}
	return result;
}

/** Finalizes raw issues (fills in messages) as a top-level parse would. */
export function finalizeIssues(
	issues: readonly z.core.$ZodRawIssue[],
): z.core.$ZodIssue[] {
	const config = z.core.config();
	return issues.map((issue) =>
		z.core.util.finalizeIssue(issue, undefined, config),
	);
}

/**
 * The codec without its `out` check: validates `in` and transforms, for
 * callers that validate `out` themselves (an enclosing schema that contains
 * `codec.out`). Encoding transforms and then validates `in` backward.
 */
export function withoutOutCheck(codec: z.core.$ZodType): z.ZodCodec {
	const { transform, reverseTransform } = codecTransforms(codec);
	return z.codec((codec as z.ZodCodec).in as z.ZodTypeAny, z.unknown(), {
		decode: transform,
		encode: reverseTransform,
	} as never) as unknown as z.ZodCodec;
}

/** The codec's transforms alone, for callers that validate both sides. */
export function transformsOnly(codec: z.core.$ZodType): z.ZodCodec {
	const { transform, reverseTransform } = codecTransforms(codec);
	return z.codec(z.unknown(), z.unknown(), {
		decode: transform,
		encode: reverseTransform,
	} as never) as unknown as z.ZodCodec;
}
