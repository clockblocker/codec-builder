import {
	dateAndIsoStringDate,
	isoStringDateAndDate,
} from "./field-codecs/common/atoms/date-and-iso-string-date";
import {
	nullishStringAndEmptiableString,
	emptiableStringAndNullishString,
} from "./field-codecs/common/atoms/nullish-string-and-emptiable-string";
import {
	numericStringAndNullishNumber,
	nullishNumberAndNumericString,
} from "./field-codecs/common/atoms/numeric-string-and-nullish-number";
import { yesNoAndBoolean } from "./field-codecs/common/atoms/yes-no-and-boolean";
import { buildNullableUnionAndNullishString } from "./field-codecs/common/builders/union-and-string-codec-builder";
import { withNullishFilteredCodecBuilder } from "./field-codecs/common/builders/with-nullish-filtered-codec-builder";
import { arrayOfNonEmptyStringsAndArrayOfStrings } from "./field-codecs/common/molecules/array-of-non-empty-strings-and-array-of-strings";
import { intStringAndInt } from "./field-codecs/common/molecules/intString-and-int";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
} from "./build-strict-field-adapter-codec";
import { buildReshapeCodec } from "./build-reshape-codec";
import { pipeCodecs } from "./pipe-codecs";
import type { AnyCodec, NoOpCodec } from "./types";

const fieldCodecs = {
	arrayOfNonEmptyStringsAndArrayOfStrings,

	dateAndIsoStringDate,
	isoStringDateAndDate,

	nullishStringAndEmptiableString,
	emptiableStringAndNullishString,

	numericStringAndNullishNumber,
	nullishNumberAndNumericString,

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

export * from "./types";
export * from "./pipe-codecs";
export * from "./build-strict-field-adapter-codec";
export * from "./build-reshape-codec";
export * from "./field-codecs/common/atoms/date-and-iso-string-date";
export * from "./field-codecs/common/atoms/nullish-string-and-emptiable-string";
export * from "./field-codecs/common/atoms/numeric-string-and-nullish-number";
export * from "./field-codecs/common/atoms/yes-no-and-boolean";
export * from "./field-codecs/common/builders/union-and-string-codec-builder";
export * from "./field-codecs/common/builders/with-nullish-filtered-codec-builder";
export * from "./field-codecs/common/molecules/array-of-non-empty-strings-and-array-of-strings";
export * from "./field-codecs/common/molecules/intString-and-int";
