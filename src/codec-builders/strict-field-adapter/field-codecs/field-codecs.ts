import type { AnyCodec, NoOpCodec } from "../../../core/types";
import { noOpCodec } from "../build-strict-field-adapter-codec";
import {
	dateAndIsoString,
	dateAndNullishIsoString,
	isoStringAndDate,
	isoStringAndNullishDate,
	nullableDateAndIsoString,
	nullableIsoStringAndDate,
} from "./atoms/derived/date";
import {
	nullableNumberAndNumericString,
	nullableNumericStringAndNumber,
	numberAndNullishNumericString,
	numberAndNumericString,
	numericStringAndNullishNumber,
	numericStringAndNumber,
} from "./atoms/derived/number";
import {
	nullableStringAndString,
	stringAndNullishString,
} from "./atoms/derived/string";
import {
	booleanAndNullishYesNo,
	booleanAndYesNo,
	nullableBooleanAndYesNo,
	nullableYesNoAndBoolean,
	yesNoAndBoolean,
	yesNoAndNullishBoolean,
} from "./atoms/derived/yes-no";
import { arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings } from "./molecules/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";
import {
	intAndNullishNumericString,
	intAndNumericString,
	nullableIntAndNumericString,
	nullableNumericStringAndInt,
	numericStringAndInt,
	numericStringAndNullishInt,
} from "./molecules/int-and-numeric-string";

type FieldCodecNamespace = {
	readonly [key: string]: AnyCodec | NoOpCodec | FieldCodecNamespace;
};

export const fieldCodecs = {
	array: {
		nonEmptyString: {
			and: {
				nullishArrayOfNullishString:
					arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings,
			},
		},
	},
	nullable: {
		date: {
			and: {
				isoString: nullableDateAndIsoString,
			},
		},
		isoString: {
			and: {
				date: nullableIsoStringAndDate,
			},
		},
		string: {
			and: {
				string: nullableStringAndString,
			},
		},
		numericString: {
			and: {
				number: nullableNumericStringAndNumber,
				int: nullableNumericStringAndInt,
			},
		},
		number: {
			and: {
				numericString: nullableNumberAndNumericString,
			},
		},
		yesNo: {
			and: {
				boolean: nullableYesNoAndBoolean,
			},
		},
		boolean: {
			and: {
				yesNo: nullableBooleanAndYesNo,
			},
		},
		int: {
			and: {
				numericString: nullableIntAndNumericString,
			},
		},
	},
	nonNullable: {
		date: {
			and: {
				isoString: dateAndIsoString,
				nullish: {
					isoString: dateAndNullishIsoString,
				},
			},
		},
		isoString: {
			and: {
				date: isoStringAndDate,
				nullish: {
					date: isoStringAndNullishDate,
				},
			},
		},
		string: {
			and: {
				nullish: {
					string: stringAndNullishString,
				},
			},
		},
		numericString: {
			and: {
				number: numericStringAndNumber,
				int: numericStringAndInt,
				nullish: {
					number: numericStringAndNullishNumber,
					int: numericStringAndNullishInt,
				},
			},
		},
		number: {
			and: {
				numericString: numberAndNumericString,
				nullish: {
					numericString: numberAndNullishNumericString,
				},
			},
		},
		yesNo: {
			and: {
				boolean: yesNoAndBoolean,
				nullish: {
					boolean: yesNoAndNullishBoolean,
				},
			},
		},
		boolean: {
			and: {
				yesNo: booleanAndYesNo,
				nullish: {
					yesNo: booleanAndNullishYesNo,
				},
			},
		},
		int: {
			and: {
				numericString: intAndNumericString,
				nullish: {
					numericString: intAndNullishNumericString,
				},
			},
		},
	},

	// Returns the same type as the original field.
	noOp: noOpCodec,
} as const satisfies FieldCodecNamespace;
