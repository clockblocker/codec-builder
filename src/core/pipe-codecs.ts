import { z } from "zod/v4";

import { forZod, type MaybePromise, then } from "./maybe-async.js";
import type { CodecPair } from "./types.js";
import { codecTransforms, type Direction, runSchema } from "./zod-internals.js";

export function pipeCodecs<
	TInputSchema extends z.ZodTypeAny,
	TIntermediateSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(
	left: z.ZodCodec<TInputSchema, TIntermediateSchema>,
	right: z.ZodCodec<TIntermediateSchema, TOutputSchema>,
): z.ZodCodec<TInputSchema, TOutputSchema>;
export function pipeCodecs<A, B, C>(
	left: CodecPair<A, B>,
	right: CodecPair<B, C>,
): CodecPair<A, C>;
export function pipeCodecs<A, B, C>(
	left: z.ZodCodec | CodecPair<A, B>,
	right: z.ZodCodec | CodecPair<B, C>,
) {
	if (left instanceof z.ZodCodec && right instanceof z.ZodCodec) {
		return pipeZodCodecs(left, right);
	}

	const leftPair = left as CodecPair<A, B>;
	const rightPair = right as CodecPair<B, C>;
	return {
		decode: (input: A) => rightPair.decode(leftPair.decode(input)),
		encode: (output: C) => leftPair.encode(rightPair.encode(output)),
	};
}

type Payload = z.core.ParsePayload<unknown>;
type Transform = (value: unknown, payload: Payload) => MaybePromise<unknown>;

// The piped codec validates `left.in` and `right.out` itself. In between it
// runs the two transforms directly and validates the middle value with
// `left.out` and `right.in` (once if they are the same schema), so nothing is
// checked twice. Failures are pushed onto the payload instead of thrown, so
// `safeDecode`/`safeEncode` report them. Async transforms or schemas make the
// result a Promise, and each step still runs once (see maybe-async.ts).
function pipeZodCodecs(left: z.ZodCodec, right: z.ZodCodec) {
	const leftDef = codecTransforms(left);
	const rightDef = codecTransforms(right);
	const middle: z.core.$ZodType[] =
		left.out === right.in ? [left.out] : [left.out, right.in];
	const middleBackward = [...middle].reverse();

	const validate = (
		schemas: readonly z.core.$ZodType[],
		value: unknown,
		direction: Direction,
		payload: Payload,
		next: (value: unknown) => MaybePromise<unknown>,
	): MaybePromise<unknown> => {
		const [schema, ...rest] = schemas;
		if (schema === undefined) return next(value);
		return then(
			runSchema(schema, value, direction, "maybe-async"),
			(result) => {
				if (result.issues.length > 0) {
					payload.issues.push(...result.issues);
					return value;
				}
				return validate(rest, result.value, direction, payload, next);
			},
		);
	};

	const run = (
		first: Transform,
		second: Transform,
		direction: Direction,
		schemas: readonly z.core.$ZodType[],
		value: unknown,
		payload: Payload,
	): MaybePromise<unknown> =>
		forZod(
			then(first(value, payload), (current) => {
				if (payload.issues.length > 0) return current;
				return validate(
					schemas,
					current,
					direction,
					payload,
					(checked) =>
						second(checked, {
							value: checked,
							issues: payload.issues,
						}),
				);
			}),
		);

	return z.codec(left.in, right.out, {
		decode: (input, payload) =>
			run(
				leftDef.transform as Transform,
				rightDef.transform as Transform,
				"decode",
				middle,
				input,
				payload as Payload,
			),
		encode: (output, payload) =>
			run(
				rightDef.reverseTransform as Transform,
				leftDef.reverseTransform as Transform,
				"encode",
				middleBackward,
				output,
				payload as Payload,
			),
	});
}
