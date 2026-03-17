import type { AnyCodec, NoOpCodec } from "../../../core/types";
import { noOpCodec } from "../build-strict-field-adapter-codec";
import { arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings } from "./molecules/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";
import { nullableDateAndNullishIsoString, nullishIsoStringAndNullableDate } from "./molecules/atoms/date-and-iso-string-date";
import { emptiableStringAndNullishString, nullishStringAndEmptiableString } from "./molecules/atoms/nullish-string-and-emptiable-string";
import { nullableNumericStringAndNullishNumber, nullishNumberAndNullableNumericString } from "./molecules/atoms/numeric-string-and-nullish-number";
import { nullableYesNoAndNullishBoolean, nullishBooleanAndNullableYesNo } from "./molecules/atoms/yes-no-and-boolean";
import { nullableNumericStringAndNullishInt, nullishIntAndNullableNumericString } from "./molecules/numeric-string-and-int";

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
		nullable: {
			and: {
				nullishIsoString: nullableDateAndNullishIsoString,
			},
		},
	},
	isoString: {
		nullish: {
			and: {
				nullableDate: nullishIsoStringAndNullableDate,
			},
		},
	},
	emptiableString: {
		and: {
			nullish: emptiableStringAndNullishString,
		},
		nullish: {
			and: {
				emptiable: nullishStringAndEmptiableString,
			},
		},
	},
	numericString: {
		nullable: {
			and: {
				nullishNumber: nullableNumericStringAndNullishNumber,
				nullishInt: nullableNumericStringAndNullishInt,
			},
		},
	},
	number: {
		nullish: {
			and: {
				nullableNumericString: nullishNumberAndNullableNumericString,
			},
		},
	},
	yesNo: {
		nullable: {
			and: {
				nullishBoolean: nullableYesNoAndNullishBoolean,
			},
		},
	},
	boolean: {
		nullish: {
			and: {
				nullableYesNo: nullishBooleanAndNullableYesNo,
			},
		},
	},
	int: {
		nullish: {
			and: {
				nullableNumericString: nullishIntAndNullableNumericString,
			},
		},
	},

	// Returns the same type as the original field.
	noOp: noOpCodec,
} as const satisfies FieldCodecNamespace;
