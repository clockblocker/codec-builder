import { dateIso } from "./atomic/date-and-isoString";
import {
	countryAndNullishSting,
	currencyAndNullishSting,
	nullableUnionAndNullishStringBuilder,
} from "./atomic/nullableUnion-and-nullishString";
import { nullishEmpty } from "./atomic/nullish-and-empty";
import { stringNumber } from "./atomic/string-and-number";
import { yesNoBool } from "./atomic/yesNo-and-bool";
import {
	arrayOf,
	buildAddaptersAndOutputSchema,
	buildAddFieldAdapterAndOutputSchema,
	buildEvenLooserAddaptersAndOutputSchema,
	buildLooseAddaptersAndOutputSchema,
	codecArrayOf,
	type Codec,
	fromPath,
	fromPaths,
	noOpCodec,
	type ShapeOfStrictFieeldAdapter,
	type ShapeOfStrictFieldAdapter,
	type ReshapeShapeFor,
	removeField,
	reshapeFor,
	type SchemaPathTuple,
} from "./build-codec";
import {
	type CodecPair,
	codec,
	pipeCodecs,
	withOutputSchema,
} from "./codec-pair";

export type { Codec };
export type { CodecPair };
export type { ReshapeShapeFor, SchemaPathTuple };
export type { ShapeOfStrictFieldAdapter, ShapeOfStrictFieeldAdapter };
export {
	arrayOf,
	codecArrayOf,
	fromPath,
	fromPaths,
	removeField,
	reshapeFor,
	buildEvenLooserAddaptersAndOutputSchema,
	buildLooseAddaptersAndOutputSchema,
	buildAddaptersAndOutputSchema,
	buildAddFieldAdapterAndOutputSchema,
};

export { codec, pipeCodecs, withOutputSchema };

export const atomicCodecs = {
	arrayOf,
	codecArrayOf,
	noOpCodec,
	dateIso,
	nullishEmpty,
	nullableUnionAndNullishStringBuilder,
	countryAndNullishSting,
	currencyAndNullishSting,
	stringNumber,
	yesNoBool,
};
