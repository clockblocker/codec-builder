import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapter,
	buildStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";

import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/helpers/builders/filtered-nullish-array";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/helpers/builders/union-and-string";
import { fieldCodecs } from "./codec-builders/strict-field-adapter/field-codecs/field-codecs";
import { reverseCodecDirections } from "./codec-builders/strict-field-adapter/helpers/casters/reverse-codec-directions";
import { toArrayOf } from "./codec-builders/strict-field-adapter/helpers/casters/to-array-of";
import { toNonNullableWithDefault } from "./codec-builders/strict-field-adapter/helpers/casters/to-non-nullable-with-default";
import { toNullable } from "./codec-builders/strict-field-adapter/helpers/casters/to-nullable";
import { pipeCodecs } from "./core/pipe-codecs";

export const codecBuilder = {
	fieldCodec: { ...fieldCodecs, arrayOf: arrayOfCodecShapes },
	helpers: {
		toArrayOf,
		toNullable,
		toNonNullableWithDefault,
		reverseCodecDirections,
		buildNullableUnionAndNullishString,
		buildFilteredNullishArrayCodec,
		pipeCodecs,
	},
	buildStrictFieldAdapter,
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
} as const;

export type { Codec } from "./core/types";
export type {
	ShapeOfStrictFieldAdapter,
	ShapeOfStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";
