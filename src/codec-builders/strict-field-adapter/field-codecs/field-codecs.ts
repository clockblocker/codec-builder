import type { AnyCodec, NoOpCodec } from "../../../core/types";
import { noOpCodec } from "../build-strict-field-adapter-codec";
import { arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings } from "./molecules/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";
import {
	dateAndIsoString,
	isoStringAndDate,
	nullableDateAndNullishIsoString,
	nullishIsoStringAndNullableDate,
} from "./molecules/date-and-iso-string-date";
import {
	nullishStringAndString,
	stringAndNullish,
} from "./molecules/nullish-string-and-emptiable-string";
import {
	nullableNumericStringAndNullishNumber,
	nullishNumberAndNullableNumericString,
	numberAndNullishNumericString,
	numberAndNumericString,
	numericStringAndNumber,
} from "./molecules/numeric-string-and-number";
import {
	booleanAndYesNo,
	nullableYesNoAndNullishBoolean,
	nullishBooleanAndNullableYesNo,
	yesNoAndBoolean,
} from "./molecules/yes-no-and-boolean";
import {
	intAndNumericString,
	nullableNumericStringAndNullishInt,
	nullishIntAndNullableNumericString,
	numericStringAndInt,
} from "./molecules/numeric-string-and-int";

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
	date: {
		and: {
			isoString: dateAndIsoString,
		},
		nullable: {
			and: {
				nullishIsoString: nullableDateAndNullishIsoString,
			},
		},
	},
	isoString: {
		and: {
			date: isoStringAndDate,
		},
		nullish: {
			and: {
				nullableDate: nullishIsoStringAndNullableDate,
			},
		},
	},
	string: {
		and: {
			nullish: stringAndNullish,
		},
		nullish: {
			and: {
				string: nullishStringAndString,
			},
		},
	},
	numericString: {
		and: {
			number: numericStringAndNumber,
			int: numericStringAndInt,
		},
		nullable: {
			and: {
				nullishNumber: nullableNumericStringAndNullishNumber,
				nullishInt: nullableNumericStringAndNullishInt,
			},
		},
	},
	number: {
		and: {
			numericString: numberAndNumericString,
			nullishNumericString: numberAndNullishNumericString,
		},
		nullish: {
			and: {
				nullableNumericString: nullishNumberAndNullableNumericString,
			},
		},
	},
	yesNo: {
		and: {
			boolean: yesNoAndBoolean,
		},
		nullable: {
			and: {
				nullishBoolean: nullableYesNoAndNullishBoolean,
			},
		},
	},
	boolean: {
		and: {
			yesNo: booleanAndYesNo,
		},
		nullish: {
			and: {
				nullableYesNo: nullishBooleanAndNullableYesNo,
			},
		},
	},
	int: {
		and: {
			numericString: intAndNumericString,
		},
		nullish: {
			and: {
				nullableNumericString: nullishIntAndNullableNumericString,
			},
		},
	},

	// Returns the same type as the original field.
	noOp: noOpCodec,
} as const satisfies FieldCodecNamespace;
