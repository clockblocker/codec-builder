import type { Codec } from "../build-codec";
import { numericStringOrUndefined } from "../shitty-input-schemas";

export function numberToString(v: number): string;
export function numberToString(v: number | undefined): string | undefined;
export function numberToString(v: number | undefined): string | undefined {
	return v === undefined ? undefined : String(v);
}

export function stringToNumber(v: string): number;
export function stringToNumber(v: string | undefined): number | undefined;
export function stringToNumber(v: string | undefined): number | undefined {
	return v === undefined ? undefined : Number(v);
}

export const stringNumber = {
	fromInput: numberToString,
	fromOutput: stringToNumber,
	outputSchema: numericStringOrUndefined,
} satisfies Codec<
	string | undefined,
	number | undefined,
	typeof numericStringOrUndefined
>;
