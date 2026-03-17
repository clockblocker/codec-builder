import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";

import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/builders/filtered-nullish-array";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/builders/union-and-string";
import { fieldCodecs } from "./codec-builders/strict-field-adapter/field-codecs/field-codecs";
import { reverseCodecDirections } from "./codec-builders/strict-field-adapter/helpers/reverse-codec-directions";
import { toArrayOf } from "./codec-builders/strict-field-adapter/helpers/to-array-of";
import { toNonNullableWithDefault } from "./codec-builders/strict-field-adapter/helpers/to-non-nullable-with-default";
import { toNullable } from "./codec-builders/strict-field-adapter/helpers/to-nullable";
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
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
} as const;

export type { Codec } from "./core/types";
