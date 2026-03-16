import {
	dateAndIsoStringDate,
	isoStringDateAndDate,
} from "./field-codecs/atoms/date-and-iso-string-date";
import {
	nullishStringAndEmptiableString,
	emptiableStringAndNullishString,
} from "./field-codecs/atoms/nullish-string-and-emptiable-string";
import {
	numericStringAndNullishNumber,
	nullishNumberAndNumericString,
} from "./field-codecs/atoms/numeric-string-and-nullish-number";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "./field-codecs/atoms/yes-no-and-boolean";
import { buildNullableUnionAndNullishString } from "./field-codecs/builders/union-and-string-codec-builder";
import { withNullishFilteredCodecBuilder } from "./field-codecs/builders/with-nullish-filtered-codec-builder";
import { arrayOfNonEmptyStringsAndArrayOfStrings } from "./field-codecs/molecules/array-of-non-empty-strings-and-array-of-strings";
import { intStringAndInt } from "./field-codecs/molecules/intString-and-int";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
} from "./codec-builders/build-strict-field-adapter-codec";
import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import { pipeCodecs } from "./core/pipe-codecs";
import type { AnyCodec, NoOpCodec } from "./core/types";

const fieldCodecs = {
	arrayOfNonEmptyStringsAndArrayOfStrings,

	dateAndIsoStringDate,
	isoStringDateAndDate,

	nullishStringAndEmptiableString,
	emptiableStringAndNullishString,

	numericStringAndNullishNumber,
	nullishNumberAndNumericString,

	booleanAndYesNo,
	yesNoAndBoolean,
	intStringAndInt,

	// Returns the same type as the original field.
	noOp: noOpCodec,
} as const satisfies Record<string, AnyCodec | NoOpCodec>;

export const codecBuilder = {
	fieldCodec: { ...fieldCodecs, arrayOfCodecShapes },
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
	nullableUnionAndNullishStringBuilder: buildNullableUnionAndNullishString,
	withNullishFilteredCodecBuilder,
	pipeCodecs,
} as const;

export {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
} from "./codec-builders/build-strict-field-adapter-codec";

export type {
	ShapeOfStrictFieldAdapterCodec,
} from "./codec-builders/build-strict-field-adapter-codec";
