import type { AnyCodec, NoOpCodec } from "../../../core/types";
import { noOpCodec } from "../build-strict-field-adapter-codec";
import { toNonNullableWithDefault } from "./helpers/to-non-nullable-with-default";
import { toNullable } from "./helpers/to-nullable";
import { arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings } from "./molecules/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";
import {
	dateAndIsoString,
	isoStringAndDate,
} from "./molecules/date-and-iso-string-date";
import {
	stringAndNullish,
} from "./molecules/nullish-string-and-emptiable-string";
import {
	intAndNumericString,
	numericStringAndInt,
} from "./molecules/numeric-string-and-int";
import {
	numberAndNumericString,
	numericStringAndNumber,
} from "./molecules/numeric-string-and-number";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "./molecules/yes-no-and-boolean";

type FieldCodecNamespace = {
	readonly [key: string]: AnyCodec | NoOpCodec | FieldCodecNamespace;
};

const nullableDateAndIsoString = toNullable(dateAndIsoString);
const dateAndNullishIsoString = toNonNullableWithDefault(
	nullableDateAndIsoString,
	new Date(),
);
const nullableIsoStringAndDate = toNullable(isoStringAndDate);
const isoStringAndNullishDate = toNonNullableWithDefault(
	nullableIsoStringAndDate,
	new Date().toISOString(),
);
const nullableStringAndString = toNullable(stringAndNullish);
const stringAndNullishString = toNonNullableWithDefault(
	nullableStringAndString,
	"",
);
const nullableNumericStringAndNumber = toNullable(numericStringAndNumber);
const numericStringAndNullishNumber = toNonNullableWithDefault(
	nullableNumericStringAndNumber,
	"0",
);
const nullableNumericStringAndInt = toNullable(numericStringAndInt);
const numericStringAndNullishInt = toNonNullableWithDefault(
	nullableNumericStringAndInt,
	"0",
);
const nullableNumberAndNumericString = toNullable(numberAndNumericString);
const numberAndNullishNumericString = toNonNullableWithDefault(
	nullableNumberAndNumericString,
	0,
);
const nullableYesNoAndBoolean = toNullable(yesNoAndBoolean);
const yesNoAndNullishBoolean = toNonNullableWithDefault(
	nullableYesNoAndBoolean,
	"No",
);
const nullableBooleanAndYesNo = toNullable(booleanAndYesNo);
const booleanAndNullishYesNo = toNonNullableWithDefault(
	nullableBooleanAndYesNo,
	false,
);
const nullableIntAndNumericString = toNullable(intAndNumericString);
const intAndNullishNumericString = toNonNullableWithDefault(
	nullableIntAndNumericString,
	0,
);

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

	// Returns the same type as the original field.
	noOp: noOpCodec,
} as const satisfies FieldCodecNamespace;
