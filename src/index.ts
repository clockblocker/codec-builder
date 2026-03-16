import {
	dateAndIsoStringDate,
	isoStringDateAndDate,
} from "./field-codecs/molecules/atoms/date-and-iso-string-date";
import {
	nullishStringAndEmptiableString,
	emptiableStringAndNullishString,
} from "./field-codecs/molecules/atoms/nullish-string-and-emptiable-string";
import {
	numericStringAndNullishNumber,
	nullishNumberAndNumericString,
} from "./field-codecs/molecules/atoms/numeric-string-and-nullish-number";
import {
	booleanAndYesNo,
	yesNoAndBoolean,
} from "./field-codecs/molecules/atoms/yes-no-and-boolean";
import { buildNullableUnionAndNullishString } from "./field-codecs/molecules/builders/union-and-string-codec-builder";
import { withNullishFilteredCodecBuilder } from "./field-codecs/molecules/builders/with-nullish-filtered-codec-builder";
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
	buildNullableUnionAndNullishString,
	withNullishFilteredCodecBuilder,
	pipeCodecs,
} as const;

export {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
} from "./codec-builders/build-strict-field-adapter-codec";

export { buildReshapeCodec } from "./codec-builders/build-reshape-codec";

export { pipeCodecs } from "./core/pipe-codecs";

export { buildNullableUnionAndNullishString } from "./field-codecs/molecules/builders/union-and-string-codec-builder";

export { withNullishFilteredCodecBuilder } from "./field-codecs/molecules/builders/with-nullish-filtered-codec-builder";

export type {
	ShapeOfStrictFieldAdapterCodec,
} from "./codec-builders/build-strict-field-adapter-codec";
