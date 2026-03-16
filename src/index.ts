import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";
import { pipeCodecs } from "./core/pipe-codecs";
import type { AnyCodec, NoOpCodec } from "./core/types";
import { arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings } from "./codec-builders/strict-field-adapter/field-codecs/molecules/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";
import {
	dateAndIsoStringDate,
	isoStringDateAndDate,
} from "./codec-builders/strict-field-adapter/field-codecs/molecules/atoms/date-and-iso-string-date";
import {
	emptiableStringAndNullishString,
	nullishStringAndEmptiableString,
} from "./codec-builders/strict-field-adapter/field-codecs/molecules/atoms/nullish-string-and-emptiable-string";
import {
	numberAndNullableNumericString,
	numericStringAndNullishNumber,
} from "./codec-builders/strict-field-adapter/field-codecs/molecules/atoms/numeric-string-and-nullish-number";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "./codec-builders/strict-field-adapter/field-codecs/molecules/atoms/yes-no-and-boolean";
import { buildArrayAndNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/molecules/builders/array-and-nullish-array";
import { buildArrayOfCodec } from "./codec-builders/strict-field-adapter/field-codecs/molecules/builders/array-of";
import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/molecules/builders/filtered-nullish-array";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/field-codecs/molecules/builders/union-and-string";
import { buildWithNullishFiltered } from "./codec-builders/strict-field-adapter/field-codecs/molecules/builders/with-nullish-filtered";
import {
	intAndNumericString,
	numericStringAndInt,
} from "./codec-builders/strict-field-adapter/field-codecs/molecules/numeric-string-and-int";

const fieldCodecs = {
	arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings,

	dateAndIsoStringDate,
	isoStringDateAndDate,

	nullishStringAndEmptiableString,
	emptiableStringAndNullishString,

	numericStringAndNullishNumber,
	numberAndNullableNumericString,

	yesNoAndBoolean,
	booleanAndYesNo,

	numericStringAndInt,
	intAndNumericString,

	// Returns the same type as the original field.
	noOp: noOpCodec,
} as const satisfies Record<string, AnyCodec | NoOpCodec>;

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
