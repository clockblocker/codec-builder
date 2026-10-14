import { reverseCodecDirections } from "../../../helpers/casters/reverse-codec-directions.js";
import { intAndNumber } from "../core-non-nullable-codecs/int-and-number.js";

export const numberAndInt = reverseCodecDirections(intAndNumber);
