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
	arrayOfCodecShapes,
	buildAddaptersAndOutputSchema,
	buildAddFieldAdapterAndOutputSchema,
	buildLooseAddaptersAndOutputSchema,
	codecArrayOf,
	noOpCodec,
	type ShapeOfStrictFieeldAdapter,
	type ShapeOfStrictFieldAdapter,
} from "./build-codec";
import { type CodecPair, codec, pipeCodecs, withOutputSchema } from "./codec-pair";

export type { Codec } from "../types";
export type { CodecPair };
export type { ShapeOfStrictFieldAdapter, ShapeOfStrictFieeldAdapter };
export {
	arrayOf,
	arrayOfCodecShapes,
	codecArrayOf,
	buildLooseAddaptersAndOutputSchema,
	buildAddaptersAndOutputSchema,
	buildAddFieldAdapterAndOutputSchema,
};

export { codec, pipeCodecs, withOutputSchema };
export * from "../index";

export const atomicCodecs = {
	arrayOf,
	arrayOfCodecShapes,
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
