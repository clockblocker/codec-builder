import type { Codec } from "../build-codec";
import { nonNullishString } from "../shitty-input-schemas";

export function nullishToEmpty(v: string | null | undefined): string {
	return v ?? "";
}

export function emptyToNullish(v: string): string | undefined {
	return v === "" ? undefined : v;
}

export const nullishEmpty = {
	fromInput: nullishToEmpty,
	fromOutput: emptyToNullish,
	outputSchema: nonNullishString,
} satisfies Codec<string, string | null | undefined, typeof nonNullishString>;
