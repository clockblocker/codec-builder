import { reverseCodecDirections } from "../../../helpers/casters/reverse-codec-directions";
import { toNonNullableWithDefault } from "../../../helpers/casters/to-non-nullable-with-default";
import { toNullable } from "../../../helpers/casters/to-nullable";
import { intAndNumber } from "../core-non-nullable-codecs/int-and-number";

export { intAndNumber };

export const numberAndInt = reverseCodecDirections(intAndNumber);

export const nullableIntAndNumber = toNullable(intAndNumber);
export const intAndNullishNumber = toNonNullableWithDefault(
	nullableIntAndNumber,
	0,
);

export const nullableNumberAndInt = toNullable(numberAndInt);
export const numberAndNullishInt = toNonNullableWithDefault(
	nullableNumberAndInt,
	0,
);
