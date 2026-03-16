export type Nullish<T> = T | null | undefined;

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
