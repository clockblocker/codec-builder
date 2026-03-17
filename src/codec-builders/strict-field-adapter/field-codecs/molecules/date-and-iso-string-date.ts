import { buildNullableOutputAndNullishInputCodec } from "../builders/nullable-output-and-nullish-input";
import { reverseCodecDirections } from "../helpers/reverse-codec-directions";
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
	buildNullableOutputAndNullishInputCodec(dateAndIsoString);

export const nullishIsoStringAndNullableDate = reverseCodecDirections(
	nullableDateAndNullishIsoString,
);

export const dateAndNullishIsoString = nullableDateAndNullishIsoString;
export const isoStringAndNullableDate = nullishIsoStringAndNullableDate;
