import { Schema } from "effect";
import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../../helpers/casters/to-nullable.js";

export const nullableStringAndString = toNullable(Schema.String);
export const stringAndNullishString = toNonNullishWithDefault(
	nullableStringAndString,
	"",
);
