// `codec-builder-library/effect4`: the same builders on Effect 4 Schema.
// Nothing here imports zod, and the Zod entry points don't import effect
// (tests/effect4/boundary.test.ts).
import { buildReshapeCodec } from "./codec-builders/build-reshape-codec.js";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec.js";
import { fieldCodecs } from "./codec-builders/strict-field-adapter/field-codecs/field-codecs.js";
import { toArrayOf } from "./codec-builders/strict-field-adapter/helpers/casters/to-array-of.js";
import { toNonNullishWithDefault } from "./codec-builders/strict-field-adapter/helpers/casters/to-non-nullish-with-default.js";
import { toNullable } from "./codec-builders/strict-field-adapter/helpers/casters/to-nullable.js";
import { toNullish } from "./codec-builders/strict-field-adapter/helpers/casters/to-nullish.js";
import { toOptional } from "./codec-builders/strict-field-adapter/helpers/casters/to-optional.js";
import { pipeCodecs } from "./core/pipe-codecs.js";

export const codecBuilder = {
	fieldCodec: { ...fieldCodecs, arrayOf: arrayOfCodecShapes },
	helpers: {
		toArrayOf,
		toOptional,
		toNullable,
		toNullish,
		toNonNullishWithDefault,
		pipeCodecs,
	},
	buildStrictFieldAdapterCodec,
	buildReshapeCodec,
} as const;

export type {
	ShapeOfStrictFieldAdapterCodec,
	StrictFieldAdapterCodec,
} from "./codec-builders/strict-field-adapter/build-strict-field-adapter-codec.js";
export type { Codec, DefaultValue } from "./core/types.js";
