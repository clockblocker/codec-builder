import { z } from "zod";

import type { Codec } from "../../core/types";
import { mapNullishToUndefined } from "../../core/helpers/nullish-utils";
import { reverseCodecDirections } from "../../core/helpers/reverse-codec-directions";

const isoStringDateSchema = z.string().date();

const nullishIsoStringDateSchema = isoStringDateSchema.nullish();
const nullishDateSchema = z.date().nullish();

export const dateAndIsoStringDate = {
	fromInput: v =>
		mapNullishToUndefined(v, value =>
			Number.isNaN(Date.parse(value)) ? undefined : new Date(value),
		),
	fromOutput: v => mapNullishToUndefined(v, value => value.toISOString().slice(0, 10)),
	inputSchema: nullishIsoStringDateSchema,
	outputSchema: nullishDateSchema,
} as const satisfies Codec<typeof nullishIsoStringDateSchema, typeof nullishDateSchema>;

export const isoStringDateAndDate = reverseCodecDirections(dateAndIsoStringDate);
