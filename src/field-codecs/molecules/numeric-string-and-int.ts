import { reverseCodecDirections } from "../../core/helpers/reverse-codec-directions";
import { pipeCodecs } from "../../core/pipe-codecs";
import { floatAndInt } from "./atoms/int-and-float";
import { nullableNumericStringAndNullishNumber } from "./atoms/numeric-string-and-nullish-number";

export const numericStringAndInt = pipeCodecs(
	floatAndInt,
	nullableNumericStringAndNullishNumber,
);

export const intAndNumericString = reverseCodecDirections(numericStringAndInt);
