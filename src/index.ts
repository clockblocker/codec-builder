import { buildReshapeCodec } from "./codec-builders/build-reshape-codec";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec";

import { buildArrayAndNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/array-and-nullish-array";
import { buildArrayOfCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/array-of";
import { buildFilteredNullishArrayCodec } from "./codec-builders/strict-field-adapter/field-codecs/builders/filtered-nullish-array";
import { buildNullableUnionAndNullishString } from "./codec-builders/strict-field-adapter/field-codecs/builders/union-and-string";
import { buildWithNullishFiltered } from "./codec-builders/strict-field-adapter/field-codecs/builders/with-nullish-filtered";
import { fieldCodecs } from "./codec-builders/strict-field-adapter/field-codecs/field-codecs";
import { pipeCodecs } from "./core/pipe-codecs";

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

export type { Codec } from "./core/types";
