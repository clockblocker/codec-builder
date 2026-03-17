import { z } from "zod";
import {
	arrayOfCodecShapes,
	buildStrictFieldAdapterCodec,
	noOpCodec,
	type ShapeOfStrictFieldAdapterCodec,
} from "../src/codec-builders/strict-field-adapter/build-strict-field-adapter-codec";
import { pipeCodecs } from "../src/core/pipe-codecs";
import type { Codec, SchemaCodec } from "../src/core/types";
import { yesNoAndBoolean } from "../src/codec-builders/strict-field-adapter/field-codecs/molecules/atoms/yes-no-and-boolean";

const yesNoBool = yesNoAndBoolean;
const codecArrayOf = arrayOfCodecShapes;

type Properties<T> = {
	[K in keyof T]-?: z.ZodType<T[K], z.ZodTypeDef, T[K]>;
};

interface Counterparty {
	id: number | null;
}

interface Client {
	id: number;
	counterparties: Counterparty[];
}

function ClientSchemaWidened(): z.ZodObject<Properties<Client>> {
	return z.object({
		id: z.number(),
		counterparties: z.array(
			z.object({
				id: z.number().nullable(),
			}),
		),
	}) as z.ZodObject<Properties<Client>>;
}

const counterpartyCodec = {
	id: noOpCodec,
};

const widened = buildStrictFieldAdapterCodec(ClientSchemaWidened(), {
	id: noOpCodec,
	counterparties: codecArrayOf(counterpartyCodec),
});

buildStrictFieldAdapterCodec(ClientSchemaWidened(), {
	// @ts-expect-error widened scalar number field cannot use yes/no codec
	id: yesNoBool,
	counterparties: codecArrayOf(counterpartyCodec),
});

buildStrictFieldAdapterCodec(ClientSchemaWidened(), {
	// @ts-expect-error widened scalar number field cannot use array shape
	id: codecArrayOf(counterpartyCodec),
	counterparties: codecArrayOf(counterpartyCodec),
});

type WidenedOutput = z.infer<typeof widened.outputSchema>;
const widenedArrayCheck: WidenedOutput["counterparties"] = [{ id: 1 }];
type CounterpartyId = WidenedOutput["counterparties"][number]["id"];

type IsAny<T> = 0 extends 1 & T ? true : false;
type Assert<T extends true> = T;
type AssertFalse<T extends false> = T;

type _counterpartyIdIsNotAny = AssertFalse<IsAny<CounterpartyId>>;
type _counterpartyIdMatches = Assert<
	CounterpartyId extends number | null ? true : false
>;

const strict = z.object({
	id: z.number(),
});

buildStrictFieldAdapterCodec(strict, {
	// @ts-expect-error number field cannot use yes/no codec
	id: yesNoBool,
});

buildStrictFieldAdapterCodec(strict, {
	// @ts-expect-error scalar field cannot use array shape
	id: codecArrayOf(counterpartyCodec),
});

const numberOrStringInputCodec = {
	fromInput: (v: number | string) => String(v),
	fromOutput: (v: string) => Number(v),
	inputSchema: z.union([z.number(), z.string()]),
	outputSchema: z.string(),
} satisfies SchemaCodec<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodString>;

buildStrictFieldAdapterCodec(strict, {
	id: numberOrStringInputCodec,
});

const strictArray = z.object({
	dates: z.array(z.number()),
});

const numberToDateCodec = {
	fromInput: (v: number) => new Date(v),
	fromOutput: (v: Date) => v.getTime(),
	inputSchema: z.number(),
	outputSchema: z.date(),
} satisfies SchemaCodec<z.ZodNumber, z.ZodDate>;

const dateToIsoCodec = {
	fromInput: (v: Date) => v.toISOString(),
	fromOutput: (v: string) => new Date(v),
	inputSchema: z.date(),
	outputSchema: z.string(),
} satisfies SchemaCodec<z.ZodDate, z.ZodString>;

const publicCodec = {
	fromInput: (v: number) => String(v),
	fromOutput: (v: string) => Number(v),
	inputSchema: z.number(),
	outputSchema: z.string(),
} satisfies Codec<string, number>;

const pipedDateToIsoCodec = pipeCodecs(numberToDateCodec, dateToIsoCodec);
type PipedDateToIsoInput = z.infer<typeof pipedDateToIsoCodec.inputSchema>;
type PipedDateToIsoOutput = z.infer<typeof pipedDateToIsoCodec.outputSchema>;
const pipedDateToIsoInput: PipedDateToIsoInput = 1;
const pipedDateToIsoOutput: PipedDateToIsoOutput = "2020-01-01T00:00:00.000Z";

const strictArrayMapped = buildStrictFieldAdapterCodec(strictArray, {
	dates: codecArrayOf(numberToDateCodec),
});

type StrictArrayMappedOutput = z.infer<typeof strictArrayMapped.outputSchema>;
const strictArrayMappedCheck: StrictArrayMappedOutput["dates"] = [new Date()];

buildStrictFieldAdapterCodec(strictArray, {
	// @ts-expect-error number[] item cannot use yes/no codec
	dates: codecArrayOf(yesNoBool),
});

const strictNested = z.object({
	a: z.object({
		b: z.number(),
		c: z.string(),
	}),
});

buildStrictFieldAdapterCodec(strictNested, {
	a: {
		b: noOpCodec,
		c: noOpCodec,
		packed: noOpCodec,
	},
});

const questionnaireServerSchema = z.object({
	ans_to_q1: z.string(),
	comment_to_q1_: z.string(),
	id: z.number(),
	dateOfConstruction: z.string(),
	answers: z.array(
		z.object({
			ans_to_q2: z.string(),
			comment_to_q2_: z.string(),
		}),
	),
});

type QuestionnaireServer = z.infer<typeof questionnaireServerSchema>;
const questionnaireAnswersItemShape = {
	ans_to_q2: noOpCodec,
	comment_to_q2_: noOpCodec,
} satisfies ShapeOfStrictFieldAdapterCodec<QuestionnaireServer["answers"][number]>;

const questionnaireAnswersItemShapeWithWrongKey = {
	ans_to_q2: noOpCodec,
	comment_to_q2_: noOpCodec,
	// @ts-expect-error typo key should be rejected at declaration site
	comment_to_q2: noOpCodec,
} satisfies ShapeOfStrictFieldAdapterCodec<QuestionnaireServer["answers"][number]>;

void widenedArrayCheck;
void strictArrayMappedCheck;
void pipedDateToIsoInput;
void pipedDateToIsoOutput;
void questionnaireAnswersItemShape;
void questionnaireAnswersItemShapeWithWrongKey;
void publicCodec;
