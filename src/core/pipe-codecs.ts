import { z } from "zod/v4";

import type { CodecPair } from "./types.js";
import { codecTransforms } from "./zod-internals.js";

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
type Transform = (value: unknown, payload: Payload) => unknown;

// The piped codec validates `left.in` and `right.out` itself. In between it
// runs the two transforms directly and validates the middle value with
// `left.out` and `right.in` (once if they are the same schema), so nothing is
// checked twice. Failures are pushed onto the payload instead of thrown, so
// `safeDecode`/`safeEncode` report them.
function pipeZodCodecs(left: z.ZodCodec, right: z.ZodCodec) {
	const leftDef = codecTransforms(left);
	const rightDef = codecTransforms(right);
	const middle: z.core.$ZodType[] =
		left.out === right.in ? [left.out] : [left.out, right.in];
	const middleBackward = [...middle].reverse();

	const run = (
		first: Transform,
		second: Transform,
		check: (schema: z.core.$ZodType, value: unknown) => SafeResult,
		schemas: readonly z.core.$ZodType[],
		value: unknown,
		payload: Payload,
	): unknown => {
		let current = syncValue(first(value, payload));
		if (payload.issues.length > 0) return current;
		for (const schema of schemas) {
			const result = check(schema, current);
			if (!result.success) {
				payload.issues.push(
					...(result.error.issues as z.core.$ZodRawIssue[]),
				);
				return current;
			}
			current = result.data;
		}
		return syncValue(
			second(current, { value: current, issues: payload.issues }),
		);
	};

	return z.codec(left.in, right.out, {
		decode: (input, payload) =>
			run(
				leftDef.transform as Transform,
				rightDef.transform as Transform,
				(schema, value) => z.safeDecode(schema, value),
				middle,
				input,
				payload as Payload,
			),
		encode: (output, payload) =>
			run(
				rightDef.reverseTransform as Transform,
				leftDef.reverseTransform as Transform,
				(schema, value) => z.safeEncode(schema, value),
				middleBackward,
				output,
				payload as Payload,
			),
	});
}

type SafeResult = z.ZodSafeParseResult<unknown>;

function syncValue(value: unknown): unknown {
	if (value instanceof Promise) {
		throw new z.core.$ZodAsyncError();
	}
	return value;
}
