import { z } from "zod/v4";

/**
 * An array codec that drops `null` and `undefined` items on decode. Other
 * falsy items (`0`, `false`, `""`) are kept.
 */
export function buildFilteredNullishArrayCodec<
	TInputItemSchema extends z.ZodTypeAny,
	TOutputItemSchema extends z.ZodTypeAny = TInputItemSchema,
>(
	inputItemSchema: TInputItemSchema,
	outputItemSchema = inputItemSchema as unknown as TOutputItemSchema,
) {
	const inputSchema = z.array(inputItemSchema);
	const outputSchema = z.array(outputItemSchema);

	return z.codec(inputSchema, outputSchema, {
		decode: (input) =>
			input.filter(
				(item) => item !== null && item !== undefined,
			) as unknown as z.input<TOutputItemSchema>[],
		encode: (output) => output as unknown as z.output<TInputItemSchema>[],
	});
}
