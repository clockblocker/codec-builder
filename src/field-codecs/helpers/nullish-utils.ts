export function mapNullishToUndefined<TInput, TOutput>(
	value: TInput | null | undefined,
	map: (value: TInput) => TOutput,
): TOutput | undefined {
	return value == null ? undefined : map(value);
}

export function mapNullishToNull<TInput, TOutput>(
	value: TInput | null | undefined,
	map: (value: TInput) => TOutput,
): TOutput | null {
	return value == null ? null : map(value);
}

export function nullishToUndefined<T>(
	value: T | null | undefined,
): T | undefined {
	return value ?? undefined;
}
