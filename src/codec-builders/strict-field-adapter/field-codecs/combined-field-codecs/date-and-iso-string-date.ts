import {
	dateAndIsoString,
	dateAndIsoStringDate,
	isoStringAndDate,
	isoStringDateAndDate,
} from "../atoms/date-and-iso-string-date";
import { reverseCodecDirections } from "../helpers/reverse-codec-directions";
import { toNullable } from "../helpers/to-nullable";

export {
	dateAndIsoString,
	dateAndIsoStringDate,
	isoStringAndDate,
	isoStringDateAndDate,
};

export const nullableDateAndNullishIsoString = toNullable(dateAndIsoString);

export const nullishIsoStringAndNullableDate = reverseCodecDirections(
	nullableDateAndNullishIsoString,
);

export const dateAndNullishIsoString = nullableDateAndNullishIsoString;
export const isoStringAndNullableDate = nullishIsoStringAndNullableDate;
