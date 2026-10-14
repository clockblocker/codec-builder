// Helpers for transforms whose nested schemas may be async. Field codecs
// run through runSchema(..., "maybe-async") (see zod-internals.ts), which
// returns a value when everything is sync and a Promise as soon as a step is
// async, running each step once. A transform then returns that Promise:
// `decodeAsync` awaits it, and `decode` throws Zod's `$ZodAsyncError`.

export type MaybePromise<T> = T | Promise<T>;

export function then<T, R>(
	value: MaybePromise<T>,
	next: (value: T) => MaybePromise<R>,
): MaybePromise<R> {
	return value instanceof Promise ? value.then(next) : next(value);
}

export function all<T>(values: MaybePromise<T>[]): MaybePromise<T[]> {
	return values.some((value) => value instanceof Promise)
		? Promise.all(values)
		: (values as T[]);
}

// When a sync `decode` gets a Promise from a transform, Zod throws its async
// error but still chains a step onto that Promise (validating `out`), and
// nobody awaits it. If that step fails (an async check in `out` run in sync
// mode), the rejection would be reported as unhandled, which native Zod
// avoids. Promises handed to Zod are therefore of this subclass: every
// promise chained onto them also gets a no-op rejection handler. Whoever
// awaits the chain (an async `decode`) still receives the rejection.
class ChainedForZod<T> extends Promise<T> {
	static override get [Symbol.species]() {
		return Promise;
	}

	// biome-ignore lint/suspicious/noThenProperty: a Promise subclass on purpose
	override then<R1 = T, R2 = never>(
		onFulfilled?: ((value: T) => R1 | PromiseLike<R1>) | null,
		onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
	): Promise<R1 | R2> {
		const next = super.then(onFulfilled, onRejected);
		next.then(undefined, () => {});
		return next;
	}
}

/** Prepares a transform's result for Zod (see ChainedForZod). */
export function forZod<T>(value: MaybePromise<T>): MaybePromise<T> {
	return value instanceof Promise ? ChainedForZod.resolve(value) : value;
}
