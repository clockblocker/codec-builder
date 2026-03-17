import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";

import { buildArrayOfCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/array-of";
import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/filtered-nullish-array";
import { buildNullableOutputAndNullishInputCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/nullable-output-and-nullish-input";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/field-codecs/builders/union-and-string";
import { fieldCodecs } from "./codec-builders/strict-field-adapter/field-codecs/field-codecs";
import { toNonNullishWithDefault } from "./codec-builders/strict-field-adapter/field-codecs/helpers/non-nullable-output-and-input-with-default";
import { pipeCodecs } from "./core/pipe-codecs";

export const codecBuilder = {
	fieldCodec: { ...fieldCodecs, arrayOfCodecShapes },
	helpers: {
		buildArrayOfCodec,
		buildNullableOutputAndNullishInputCodec,
		toNonNullishWithDefault,
		buildNullableUnionAndNullishString,
		buildFilteredNullishArrayCodec,
		pipeCodecs,
	},
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
} as const;

export type { Codec } from "./core/types";
