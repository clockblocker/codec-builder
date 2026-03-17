import { z } from "zod";
import { reverseCodecDirections } from "../../builders/reverse-codec-directions";
import type { Codec } from "../../../../../core/types";

const isoStringSchema = z.string().date();
const dateSchema = z.date();

export const dateAndIsoString = {
	fromInput: (v) => new Date(v),
	fromOutput: (v) => v.toISOString(),
	inputSchema: isoStringSchema,
	outputSchema: dateSchema,
} as const satisfies Codec<Date, string>;

export const isoStringAndDate = reverseCodecDirections(dateAndIsoString);

export const dateAndIsoStringDate = dateAndIsoString;
export const isoStringDateAndDate = isoStringAndDate;
