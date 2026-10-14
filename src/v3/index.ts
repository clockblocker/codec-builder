import { buildReshapeCodec } from "./codec-builders/build-reshape-codec.js";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapter,
	buildStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec.js";
import { fieldCodecs } from "./codec-builders/strict-field-adapter/field-codecs/field-codecs.js";
import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/helpers/builders/filtered-nullish-array.js";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/helpers/builders/union-and-string.js";
import { reverseCodecDirections } from "./codec-builders/strict-field-adapter/helpers/casters/reverse-codec-directions.js";
import { toArrayOf } from "./codec-builders/strict-field-adapter/helpers/casters/to-array-of.js";
import { toNonNullishWithDefault } from "./codec-builders/strict-field-adapter/helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "./codec-builders/strict-field-adapter/helpers/casters/to-nullable.js";
import { toNullish } from "./codec-builders/strict-field-adapter/helpers/casters/to-nullish.js";
import { toOptional } from "./codec-builders/strict-field-adapter/helpers/casters/to-optional.js";
import { pipeCodecs } from "./core/pipe-codecs.js";

export const codecBuilder3 = {
	fieldCodec: { ...fieldCodecs, arrayOf: arrayOfCodecShapes },
	helpers: {
		toArrayOf,
		toOptional,
		toNullable,
		toNullish,
		toNonNullishWithDefault,
		reverseCodecDirections,
		buildNullableUnionAndNullishString,
		buildFilteredNullishArrayCodec,
		pipeCodecs,
	},
	buildStrictFieldAdapter,
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
} as const;

export type {
	ShapeOfStrictFieldAdapter,
	ShapeOfStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec.js";
export type { Codec } from "./core/types.js";
