import { reverseCodecDirections } from "../../../helpers/reverse-codec-directions";
import { toNonNullableWithDefault } from "../../../helpers/to-non-nullable-with-default";
import { toNullable } from "../../../helpers/to-nullable";
import {
	dateAndIsoString,
	isoStringAndDate,
} from "../core-non-nullable-codecs/date-and-iso-string";

export { dateAndIsoString, isoStringAndDate };

export const nullableDateAndIsoString = toNullable(dateAndIsoString);
export const dateAndNullishIsoString = toNonNullableWithDefault(
	nullableDateAndIsoString,
	new Date(),
);

export const nullableIsoStringAndDate = reverseCodecDirections(
	nullableDateAndIsoString,
);
export const isoStringAndNullishDate = toNonNullableWithDefault(
	nullableIsoStringAndDate,
	new Date().toISOString(),
);
