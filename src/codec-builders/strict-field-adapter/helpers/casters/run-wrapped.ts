import type { z } from "zod/v4";
import {
	all,
	forZod,
	type MaybePromise,
	then,
} from "../../../../core/maybe-async.js";
import {
	type Direction,
	runTransform,
} from "../../../../core/zod-internals.js";

// The casters wrap a codec in new `in`/`out` schemas built from the codec's
// own (`codec.in.nullish()`, `z.array(codec.out)`, ...), which Zod validates.
// So inside the wrapper's transform only the codec's decode/encode function
// runs: each schema is checked once, issues land on the wrapper's payload
// with their path, and an async function makes the result a Promise.

type Payload = z.core.ParsePayload<unknown>;

/** Runs the wrapped codec's function on a non-nullish value. */
export function runWrapped(
	codec: z.core.$ZodType,
	direction: Direction,
	value: unknown,
	payload: Payload,
): MaybePromise<unknown> {
	return forZod(runTransform(codec, direction, value, payload));
}

/** Runs the wrapped codec's function on each item, prefixing issue paths. */
export function runWrappedItems(
	codec: z.core.$ZodType,
	direction: Direction,
	items: readonly unknown[],
	payload: Payload,
): MaybePromise<unknown[]> {
	return forZod(
		all(
			items.map((item, index) => {
				const itemPayload: Payload = { value: item, issues: [] };
				return then(
					runTransform(codec, direction, item, itemPayload),
					(result) => {
						for (const issue of itemPayload.issues) {
							payload.issues.push({
								...issue,
								path: [index, ...(issue.path ?? [])],
							});
						}
						return result;
					},
				);
			}),
		),
	);
}
