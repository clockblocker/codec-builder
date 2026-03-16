import type { Nullish } from "./types";

export function mapNullishToUndefined<TInput, TOutput>(
	value: Nullish<TInput>,
	map: (value: TInput) => TOutput,
): TOutput | undefined {
	return value == null ? undefined : map(value);
}

export function mapNullishToNull<TInput, TOutput>(
	value: Nullish<TInput>,
	map: (value: TInput) => TOutput,
): TOutput | null {
	return value == null ? null : map(value);
}

export function nullishToUndefined<T>(
	value: Nullish<T>,
): T | undefined {
	return value ?? undefined;
}
