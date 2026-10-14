import { z } from "zod/v4";
import type { Nullish } from "../../../../../core/helpers/nullish-utils.js";
import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../../helpers/casters/to-nullable.js";

const stringSchema = z.string();
const nullishStringSchema = stringSchema.nullish();

export const stringAndNullish = z.codec(nullishStringSchema, stringSchema, {
	decode: (value: Nullish<string>) => value ?? "",
	encode: (value) => value,
});

export const nullishStringAndString = z.invertCodec(stringAndNullish);

export const nullableStringAndString = toNullable(stringAndNullish);
export const stringAndNullishString = toNonNullishWithDefault(
	nullableStringAndString,
	"",
);
