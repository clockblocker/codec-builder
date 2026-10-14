/* eslint-disable @typescript-eslint/no-explicit-any -- helper keeps codec generics broad */
import type { z } from "zod/v3";
import type { SchemaCodec } from "../../../../core/types.js";
import { toNullable } from "./to-nullable.js";
import { toOptional } from "./to-optional.js";

export function toNullish<
	TInputSchema extends z.ZodTypeAny,
	TOutputSchema extends z.ZodTypeAny,
>(codec: SchemaCodec<TInputSchema, TOutputSchema>) {
	return toOptional<
		z.ZodOptional<z.ZodNullable<TInputSchema>>,
		z.ZodNullable<TOutputSchema>
	>(toNullable(codec));
}
