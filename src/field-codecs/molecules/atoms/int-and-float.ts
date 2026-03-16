import { z } from "zod";
import { reverseCodecDirections } from "../../../core/helpers/reverse-codec-directions";
import type { Codec } from "../../../core/types";

const intSchema = z.number().int();
const floatSchema = z.number();

export const intAndFloat = {
	fromInput: (v) => Math.floor(v),
	fromOutput: (v) => v,
	inputSchema: floatSchema,
	outputSchema: intSchema,
} as const satisfies Codec<typeof floatSchema, typeof intSchema>;

export const floatAndInt = reverseCodecDirections(intAndFloat);
