import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";
import { arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings } from "./codec-builders/strict-field-adapter/field-codecs/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";
import {
	nullableDateAndNullishIsoString,
	nullishIsoStringAndNullableDate,
} from "./codec-builders/strict-field-adapter/field-codecs/atoms/date-and-iso-string-date";
import {
	emptiableStringAndNullishString,
	nullishStringAndEmptiableString,
} from "./codec-builders/strict-field-adapter/field-codecs/atoms/nullish-string-and-emptiable-string";
import {
	nullableNumericStringAndNullishNumber,
	nullishNumberAndNullableNumericString,
} from "./codec-builders/strict-field-adapter/field-codecs/atoms/numeric-string-and-nullish-number";
import {
	nullableYesNoAndNullishBoolean,
	nullishBooleanAndNullableYesNo,
} from "./codec-builders/strict-field-adapter/field-codecs/atoms/yes-no-and-boolean";
import { buildArrayAndNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/array-and-nullish-array";
import { buildArrayOfCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/array-of";
import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/filtered-nullish-array";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/field-codecs/builders/union-and-string";
import { buildWithNullishFiltered } from "./codec-builders/strict-field-adapter/field-codecs/builders/with-nullish-filtered";
import {
	nullableNumericStringAndNullishInt,
	nullishIntAndNullableNumericString,
} from "./codec-builders/strict-field-adapter/field-codecs/numeric-string-and-int";
import { pipeCodecs } from "./core/pipe-codecs";
import type { AnyCodec, NoOpCodec } from "./core/types";

type FieldCodecNamespace = {
	readonly [key: string]: AnyCodec | NoOpCodec | FieldCodecNamespace;
};

const fieldCodecs = {
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

export const codecBuilder = {
	fieldCodec: { ...fieldCodecs, arrayOfCodecShapes },
	helpers: {
		buildArrayOfCodec,
		buildArrayAndNullishArrayCodec,
		buildNullableUnionAndNullishString,
		buildFilteredNullishArrayCodec,
		buildWithNullishFiltered,
		pipeCodecs,
	},
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
} as const;

export type { Nullish } from "./core/helpers/helper-types";
export type { AnyCodec, Codec, NoOpCodec, SchemaCodec } from "./core/types";
