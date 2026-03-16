/** biome-ignore-all lint/suspicious/noExplicitAny: preserving broad zod object compatibility for adapter inputs */
import { z } from "zod";
import { dateToIsoString, isoStringToDate } from "../atomic/date-and-isoString";
import {
	arrayOf,
	type Codec,
	noOpCodec,
} from "../build-codec";
import { buildAddaptersAndOutputSchema } from "../build-codec";

type ReshapeInputShape = {
	l0_f1: z.ZodString;
	clients: z.ZodArray<
		z.ZodObject<{
			id: z.ZodNumber;
			l1_f1: z.ZodString;
			counterparties: z.ZodArray<
				z.ZodObject<{
					id: z.ZodNumber;
					l2_f1: z.ZodString;
				}>
			>;
		}>
	>;
};

type ReshapeCompatibleSchema = z.ZodObject<
	ReshapeInputShape,
	any,
	any,
	any,
	any
>;

const isoDateNodeCodec = {
	fromInput: (input: string) => isoStringToDate(input),
	fromOutput: (output: Date) => dateToIsoString(output),
	outputSchema: z.date(),
} satisfies Codec<Date, string, z.ZodDate>;

export function buildReshapeAtomicsCodec(inputSchema: ReshapeCompatibleSchema) {
	return buildAddaptersAndOutputSchema(inputSchema, {
		l0_f1: isoDateNodeCodec,
		clients: arrayOf({
			id: noOpCodec,
			l1_f1: isoDateNodeCodec,
			counterparties: arrayOf({
				id: noOpCodec,
				l2_f1: isoDateNodeCodec,
			}),
		}),
	});
}
