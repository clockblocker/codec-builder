export { buildReshapeCodec as buildAddFieldAdapterAndOutputSchema } from "../build-reshape-codec";
export { buildLooseAddaptersAndOutputSchema } from "./loose-adapter-builder";
export {
	type ArrayCodecShape,
	arrayOf,
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec as buildAddaptersAndOutputSchema,
	codecArrayOf,
	noOpCodec,
	type RuntimeArrayItemShape,
	type RuntimeCodecShape,
	type ShapeOfStrictFieeldAdapter,
	type ShapeOfStrictFieldAdapter,
} from "../build-strict-field-adapter-codec";
export type { Codec } from "../types";
