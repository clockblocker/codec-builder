import { reverseCodecDirections } from "../helpers/reverse-codec-directions";
import { toNullableOutputAndNullishInput } from "../helpers/to-nullable-output-and-nullish-input";
import {
	dateAndIsoString,
	dateAndIsoStringDate,
	isoStringAndDate,
	isoStringDateAndDate,
} from "./atoms/date-and-iso-string-date";

export {
	dateAndIsoString,
	dateAndIsoStringDate,
	isoStringAndDate,
	isoStringDateAndDate,
};

export const nullableDateAndNullishIsoString =
	toNullableOutputAndNullishInput(dateAndIsoString);

export const nullishIsoStringAndNullableDate = reverseCodecDirections(
	nullableDateAndNullishIsoString,
);

export const dateAndNullishIsoString = nullableDateAndNullishIsoString;
export const isoStringAndNullableDate = nullishIsoStringAndNullableDate;
