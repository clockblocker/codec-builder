import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";

import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/filtered-nullish-array";
import { toArrayOf } from "./codec-builders/strict-field-adapter/field-codecs/helpers/to-array-of";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/field-codecs/builders/union-and-string";
import { toNullableOutputAndNullishInput } from "./codec-builders/strict-field-adapter/field-codecs/helpers/to-nullable-output-and-nullish-input";
import { fieldCodecs } from "./codec-builders/strict-field-adapter/field-codecs/field-codecs";
import { toNonNullishWithDefault } from "./codec-builders/strict-field-adapter/field-codecs/helpers/to-non-nullish-with-default";
import { pipeCodecs } from "./core/pipe-codecs";

export const codecBuilder = {
	fieldCodec: { ...fieldCodecs, arrayOfCodecShapes },
	helpers: {
		toArrayOf,
		toNullableOutputAndNullishInput,
		toNonNullishWithDefault,
		buildNullableUnionAndNullishString,
		buildFilteredNullishArrayCodec,
		pipeCodecs,
	},
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
} as const;

export type { Codec } from "./core/types";
