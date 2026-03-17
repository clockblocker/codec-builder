import { z } from "zod";
import type { Codec } from "../../../../core/types";
import { reverseCodecDirections } from "../helpers/reverse-codec-directions";

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
