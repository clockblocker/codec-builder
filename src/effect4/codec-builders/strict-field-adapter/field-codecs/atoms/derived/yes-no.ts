import { toNonNullishWithDefault } from "../../../helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "../../../helpers/casters/to-nullable.js";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "../core-non-nullable-codecs/yes-no-and-boolean.js";

export { booleanAndYesNo, yesNoAndBoolean };

export const nullableYesNoAndBoolean = toNullable(yesNoAndBoolean);
export const yesNoAndNullishBoolean = toNonNullishWithDefault(
	nullableYesNoAndBoolean,
	"No",
);

export const nullableBooleanAndYesNo = toNullable(booleanAndYesNo);
export const booleanAndNullishYesNo = toNonNullishWithDefault(
	nullableBooleanAndYesNo,
	false,
);
