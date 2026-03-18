import { reverseCodecDirections } from "../../../helpers/casters/reverse-codec-directions";
import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default";
import { toNullable } from "../../../helpers/casters/to-nullable";
import { dateAndIsoString } from "../core-non-nullable-codecs/date-and-iso-string";

export { dateAndIsoString };

export const isoStringAndDate = reverseCodecDirections(dateAndIsoString);

export const nullableDateAndIsoString = toNullable(dateAndIsoString);
export const dateAndNullishIsoString = toNonNullishWithDefault(
	nullableDateAndIsoString,
	new Date(),
);

export const nullableIsoStringAndDate = toNullable(isoStringAndDate);
export const isoStringAndNullishDate = toNonNullishWithDefault(
	nullableIsoStringAndDate,
	new Date().toISOString(),
);
