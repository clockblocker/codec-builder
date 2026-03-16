import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
} from "./codec-builders/build-strict-field-adapter-codec";
import { pipeCodecs } from "./core/pipe-codecs";
import type { AnyCodec, NoOpCodec } from "./core/types";
import { arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings } from "./field-codecs/molecules/array-of-non-empty-strings-and-nullish-array-of-nullish-strings";
import {
	dateAndIsoStringDate,
	isoStringDateAndDate,
	nullableDateAndNullishIsoStringDate,
	nullishIsoStringDateAndNullableDate,
} from "./field-codecs/molecules/atoms/date-and-iso-string-date";
import { floatAndInt, intAndFloat } from "./field-codecs/molecules/atoms/int-and-float";
import {
	emptiableStringAndNullishString,
	nullishStringAndEmptiableString,
} from "./field-codecs/molecules/atoms/nullish-string-and-emptiable-string";
import {
	nullableNumericStringAndNullishNumber,
	nullishNumberAndNullableNumericString,
	numericNullishStringAndNullishNumber,
} from "./field-codecs/molecules/atoms/numeric-string-and-nullish-number";
import {
	booleanAndYesNo,
	nullableYesNoAndNullishBoolean,
	nullishBooleanAndNullableYesNo,
	yesNoAndBoolean,
} from "./field-codecs/molecules/atoms/yes-no-and-boolean";
import {
	intAndNumericString,
	numericStringAndInt,
} from "./field-codecs/molecules/numeric-string-and-int";
import { buildArrayAndNullishArrayCodec } from "./field-codecs/molecules/builders/array-and-nullish-array";
import { buildFilteredNullishArrayCodec } from "./field-codecs/molecules/builders/filtered-nullish-array";
import { buildNullableUnionAndNullishString } from "./field-codecs/molecules/builders/union-and-string";
import { withNullishFilteredCodecBuilder } from "./field-codecs/molecules/builders/with-nullish-filtered";

const fieldCodecs = {
	arrayOfNonEmptyStringsAndNullishArrayOfNullishStrings,

	nullableDateAndNullishIsoStringDate,
	dateAndIsoStringDate,

	nullishIsoStringDateAndNullableDate,
	isoStringDateAndDate,

	nullishStringAndEmptiableString,
	emptiableStringAndNullishString,

	intAndFloat,
	floatAndInt,

	nullableNumericStringAndNullishNumber,
	numericNullishStringAndNullishNumber,
	nullishNumberAndNullableNumericString,
	nullishNumberAndNumericString: nullishNumberAndNullableNumericString,

	nullableYesNoAndNullishBoolean,
	yesNoAndBoolean,

	nullishBooleanAndNullableYesNo,
	booleanAndYesNo,

	numericStringAndInt,
	intAndNumericString,

	// Returns the same type as the original field.
	noOp: noOpCodec,
} as const satisfies Record<string, AnyCodec | NoOpCodec>;

export const codecBuilder = {
	fieldCodec: { ...fieldCodecs, arrayOfCodecShapes },
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
	buildArrayAndNullishArrayCodec,
	buildNullableUnionAndNullishString,
	buildFilteredNullishArrayCodec,
	withNullishFilteredCodecBuilder,
	pipeCodecs,
} as const;
