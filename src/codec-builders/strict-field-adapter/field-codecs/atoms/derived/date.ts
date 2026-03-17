import { reverseCodecDirections } from "../../../helpers/casters/reverse-codec-directions";
import { toNonNullableWithDefault } from "../../../helpers/casters/to-non-nullable-with-default";
import { toNullable } from "../../../helpers/casters/to-nullable";
import { dateAndIsoString } from "../core-non-nullable-codecs/date-and-iso-string";

export { dateAndIsoString };

export const isoStringAndDate = reverseCodecDirections(dateAndIsoString);

export const nullableDateAndIsoString = toNullable(dateAndIsoString);
export const dateAndNullishIsoString = toNonNullableWithDefault(
	nullableDateAndIsoString,
	new Date(),
);

export const nullableIsoStringAndDate = toNullable(isoStringAndDate);
export const isoStringAndNullishDate = toNonNullableWithDefault(
	nullableIsoStringAndDate,
	new Date().toISOString(),
);
