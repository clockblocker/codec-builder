import { z } from "zod";
import { yesNoBool } from "./atomic/yesNo-and-bool";
import {
	buildAddaptersAndOutputSchema,
	buildAddFieldAdapterAndOutputSchema,
	buildEvenLooserAddaptersAndOutputSchema,
	buildLooseAddaptersAndOutputSchema,
	type Codec,
	codecArrayOf,
	fromPath,
	fromPaths,
	noOpCodec,
	removeField,
	reshapeFor,
	type ShapeOfStrictFieeldAdapter,
	type ShapeOfStrictFieldAdapter,
} from "./build-codec";
import { pipeCodecs } from "./codec-pair";

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

const widened = buildAddaptersAndOutputSchema(ClientSchemaWidened(), {
	id: noOpCodec,
	counterparties: codecArrayOf(counterpartyCodec),
});

buildAddaptersAndOutputSchema(ClientSchemaWidened(), {
	// @ts-expect-error widened scalar number field cannot use yes/no codec
	id: yesNoBool,
	counterparties: codecArrayOf(counterpartyCodec),
});

buildAddaptersAndOutputSchema(ClientSchemaWidened(), {
	// @ts-expect-error widened scalar number field cannot use array shape
	id: codecArrayOf(counterpartyCodec),
	counterparties: codecArrayOf(counterpartyCodec),
});

type WidenedOutput = z.infer<typeof widened.outputSchema>;
const _widenedArrayCheck: WidenedOutput["counterparties"] = [{ id: 1 }];
type CounterpartyId = WidenedOutput["counterparties"][number]["id"];

type IsAny<T> = 0 extends 1 & T ? true : false;
type IsUnknown<T> = unknown extends T
	? [T] extends [unknown]
		? true
		: false
	: false;
type Assert<T extends true> = T;
type AssertFalse<T extends false> = T;

type _counterpartyIdIsNotAny = AssertFalse<IsAny<CounterpartyId>>;
type _counterpartyIdMatches = Assert<
	CounterpartyId extends number | null ? true : false
>;

const strict = z.object({
	id: z.number(),
});

buildAddaptersAndOutputSchema(strict, {
	// @ts-expect-error number field cannot use yes/no codec
	id: yesNoBool,
});

buildAddaptersAndOutputSchema(strict, {
	// @ts-expect-error scalar field cannot use array shape
	id: codecArrayOf(counterpartyCodec),
});

const numberOrStringInputCodec = {
	fromInput: (v: number | string) => String(v),
	fromOutput: (v: string) => Number(v),
	outputSchema: z.string(),
} satisfies Codec<string, number | string, z.ZodString>;

buildAddaptersAndOutputSchema(strict, {
	id: numberOrStringInputCodec,
});

const strictArray = z.object({
	dates: z.array(z.number()),
});

const numberToDateCodec = {
	fromInput: (v: number) => new Date(v),
	fromOutput: (v: Date) => v.getTime(),
	outputSchema: z.date(),
} satisfies Codec<Date, number, z.ZodDate>;

const dateToIsoCodec = {
	fromInput: (v: Date) => v.toISOString(),
	fromOutput: (v: string) => new Date(v),
	outputSchema: z.string(),
} satisfies Codec<string, Date, z.ZodString>;

const pipedDateToIsoCodec = pipeCodecs(numberToDateCodec, dateToIsoCodec);
type PipedDateToIsoOutput = z.infer<typeof pipedDateToIsoCodec.outputSchema>;
const _pipedDateToIsoOutput: PipedDateToIsoOutput = "2020-01-01T00:00:00.000Z";

const strictArrayMapped = buildAddaptersAndOutputSchema(strictArray, {
	dates: codecArrayOf(numberToDateCodec),
});

type StrictArrayMappedOutput = z.infer<typeof strictArrayMapped.outputSchema>;
const _strictArrayMappedCheck: StrictArrayMappedOutput["dates"] = [new Date()];

buildAddaptersAndOutputSchema(strictArray, {
	// @ts-expect-error number[] item cannot use yes/no codec
	dates: codecArrayOf(yesNoBool),
});

const strictNested = z.object({
	a: z.object({
		b: z.number(),
		c: z.string(),
	}),
});

buildAddaptersAndOutputSchema(strictNested, {
	a: {
		b: noOpCodec,
		c: noOpCodec,
		packed: noOpCodec,
	},
});

const unknownToStringCodec = {
	fromInput: (v: unknown) => String(v ?? ""),
	fromOutput: (v: string) => v,
	outputSchema: z.string(),
} satisfies Codec<string, unknown, z.ZodString>;

const looseNested = buildLooseAddaptersAndOutputSchema(strictNested, {
	a: {
		b: noOpCodec,
		c: noOpCodec,
		packed: unknownToStringCodec,
	},
});

type LooseNestedOutput = z.infer<typeof looseNested.outputSchema>;
const _looseNestedPacked: LooseNestedOutput["a"]["packed"] = "ok";

const looseNestedDefaults = buildLooseAddaptersAndOutputSchema(strictNested, {
	a: {
		packed: unknownToStringCodec,
	},
});

type LooseNestedDefaultsOutput = z.infer<
	typeof looseNestedDefaults.outputSchema
>;
const _looseNestedDefaultB: LooseNestedDefaultsOutput["a"]["b"] = 1;
const _looseNestedDefaultC: LooseNestedDefaultsOutput["a"]["c"] = "value";

const questionnaireServerSchema = z.object({
	ans_to_q1: z.string(),
	comment_to_q1_: z.string(),
	id: z.number(),
	dateOfConstuction: z.string(),
	answers: z.array(
		z.object({
			ans_to_q2: z.string(),
			comment_to_q2_: z.string(),
		}),
	),
});

type QuestionnaireOutputQ = {
	answer: string;
	comment: string;
};

type QuestionnaireServer = z.infer<typeof questionnaireServerSchema>;
const questionnaireAnswersItemShape = {
	ans_to_q2: noOpCodec,
	comment_to_q2_: noOpCodec,
} satisfies ShapeOfStrictFieldAdapter<QuestionnaireServer["answers"][number]>;

const questionnaireAnswersItemShapeWithWrongKey = {
	ans_to_q2: noOpCodec,
	comment_to_q2_: noOpCodec,
	// @ts-expect-error typo key should be rejected at declaration site
	comment_to_q2: noOpCodec,
} satisfies ShapeOfStrictFieeldAdapter<QuestionnaireServer["answers"][number]>;

const qCodec = {
	fromInput: (pair: readonly [string, string]) => ({
		answer: pair[0],
		comment: pair[1],
	}),
	fromOutput: (q: QuestionnaireOutputQ): readonly [string, string] => [
		q.answer,
		q.comment,
	],
	outputSchema: z.object({
		answer: z.string(),
		comment: z.string(),
	}),
} satisfies Codec<
	QuestionnaireOutputQ,
	readonly [string, string],
	z.ZodObject<{
		answer: z.ZodString;
		comment: z.ZodString;
	}>
>;

const evenLooserQuestionnaire = buildEvenLooserAddaptersAndOutputSchema(
	questionnaireServerSchema,
	{
		ans_to_q1: removeField,
		comment_to_q1_: removeField,
		answers: removeField,
		questionnaire: {
			q1: fromPaths(["ans_to_q1", "comment_to_q1_"], qCodec),
			q2: fromPaths(
				["answers[0].ans_to_q2", "answers[0].comment_to_q2_"],
				qCodec,
			),
		},
		firstQAnswer: fromPath("ans_to_q1"),
	},
);

type EvenLooserQuestionnaireOutput = z.infer<
	typeof evenLooserQuestionnaire.outputSchema
>;
const _evenLooserQuestionareQ1: EvenLooserQuestionnaireOutput["questionnaire"]["q1"] =
	{
		answer: "Yes",
		comment: "Because",
	};
const _evenLooserQuestionareQ2: EvenLooserQuestionnaireOutput["questionnaire"]["q2"] =
	{
		answer: "No",
		comment: "N/A",
	};
const _evenLooserQuestionareFirstQAnswer: EvenLooserQuestionnaireOutput["firstQAnswer"] =
	"Yes";
const _evenLooserQuestionareId: EvenLooserQuestionnaireOutput["id"] = 1;
const _evenLooserQuestionareDate: EvenLooserQuestionnaireOutput["dateOfConstuction"] =
	"2020-01-01";
// @ts-expect-error removed source key should not be present in form output
const _evenLooserQuestionareRemovedField: EvenLooserQuestionnaireOutput["ans_to_q1"] =
	"Yes";

const evenLooserSchemaBoundHelpers = reshapeFor(questionnaireServerSchema);
const evenLooserQuestionnaireWithTuplePaths =
	buildEvenLooserAddaptersAndOutputSchema(questionnaireServerSchema, {
		ans_to_q1: evenLooserSchemaBoundHelpers.removeField,
		comment_to_q1_: evenLooserSchemaBoundHelpers.removeField,
		answers: evenLooserSchemaBoundHelpers.removeField,
		questionnaire: {
			q1: evenLooserSchemaBoundHelpers.fromPaths(
				[["ans_to_q1"], ["comment_to_q1_"]],
				qCodec,
			),
			q2: evenLooserSchemaBoundHelpers.fromPaths(
				[
					["answers", "0", "ans_to_q2"],
					["answers", "0", "comment_to_q2_"],
				],
				qCodec,
			),
		},
		firstQAnswer: evenLooserSchemaBoundHelpers.fromPath(["ans_to_q1"]),
	});

evenLooserSchemaBoundHelpers.fromPath(["answers", "0", "ans_to_q2"]);
// @ts-expect-error second token under answers must be an array index
evenLooserSchemaBoundHelpers.fromPath(["answers", "city"]);

type EvenLooserQuestionnaireWithTuplePathsOutput = z.infer<
	typeof evenLooserQuestionnaireWithTuplePaths.outputSchema
>;
const _evenLooserTuplePathFirstQAnswer: EvenLooserQuestionnaireWithTuplePathsOutput["firstQAnswer"] =
	"Yes";

const addQuestionareFieldCodec = buildAddFieldAdapterAndOutputSchema(
	questionnaireServerSchema,
	{
		fieldName: "questionnaire",
		fieldSchema: z.object({
			q1: z.object({ answer: z.string(), comment: z.string() }),
			q2: z.object({ answer: z.string(), comment: z.string() }),
		}),
		dropFields: ["ans_to_q1", "comment_to_q1_", "answers"],
		construct: (input) => ({
			q1: {
				answer: input.ans_to_q1,
				comment: input.comment_to_q1_,
			},
			q2: {
				answer: input.answers[0]?.ans_to_q2 ?? "",
				comment: input.answers[0]?.comment_to_q2_ ?? "",
			},
		}),
		reconstruct: (questionnaire) => ({
			ans_to_q1: questionnaire.q1.answer,
			comment_to_q1_: questionnaire.q1.comment,
			answers: [
				{
					ans_to_q2: questionnaire.q2.answer,
					comment_to_q2_: questionnaire.q2.comment,
				},
			],
		}),
	},
);

buildAddFieldAdapterAndOutputSchema(questionnaireServerSchema, {
	fieldName: "questionnaire",
	fieldSchema: z.object({
		q1: z.object({ answer: z.string(), comment: z.string() }),
		q2: z.object({ answer: z.string(), comment: z.string() }),
	}),
	dropFields: ["ans_to_q1", "comment_to_q1_", "answers"],
	construct: (input) => ({
		q1: {
			answer: input.ans_to_q1,
			comment: input.comment_to_q1_,
		},
		q2: {
			answer: input.answers[0]?.ans_to_q2 ?? "",
			comment: input.answers[0]?.comment_to_q2_ ?? "",
		},
	}),
	// @ts-expect-error reconstruct must return every dropped source field
	reconstruct: (questionnaire) => ({
		ans_to_q1: questionnaire.q1.answer,
		comment_to_q1_: questionnaire.q1.comment,
	}),
});

type AddQuestionareFieldOutput = z.infer<
	typeof addQuestionareFieldCodec.outputSchema
>;
const _addQuestionareFieldValue: AddQuestionareFieldOutput["questionnaire"] = {
	q1: { answer: "Yes", comment: "ok" },
	q2: { answer: "No", comment: "ok" },
};
type _addQuestionareFieldIdIsNotUnknown = AssertFalse<
	IsUnknown<AddQuestionareFieldOutput["id"]>
>;
type _addQuestionareFieldIdMatches = Assert<
	AddQuestionareFieldOutput["id"] extends number ? true : false
>;
// @ts-expect-error dropped source key should not be present in output
const _addQuestionareDroppedAnsToQ1: AddQuestionareFieldOutput["ans_to_q1"] =
	"Yes";

const dropQuestionnaireFieldsFromVariable: Array<
	keyof z.infer<typeof questionnaireServerSchema>
> = ["ans_to_q1", "comment_to_q1_", "answers"];
const addQuestionareFieldCodecFromVariableDropFields =
	buildAddFieldAdapterAndOutputSchema(questionnaireServerSchema, {
		fieldName: "questionnaire",
		fieldSchema: z.object({
			q1: z.object({ answer: z.string(), comment: z.string() }),
			q2: z.object({ answer: z.string(), comment: z.string() }),
		}),
		dropFields: dropQuestionnaireFieldsFromVariable,
		construct: (input) => ({
			q1: {
				answer: input.ans_to_q1,
				comment: input.comment_to_q1_,
			},
			q2: {
				answer: input.answers[0]?.ans_to_q2 ?? "",
				comment: input.answers[0]?.comment_to_q2_ ?? "",
			},
		}),
		reconstruct: (questionnaire) => ({
			ans_to_q1: questionnaire.q1.answer,
			comment_to_q1_: questionnaire.q1.comment,
			answers: [
				{
					ans_to_q2: questionnaire.q2.answer,
					comment_to_q2_: questionnaire.q2.comment,
				},
			],
		}),
	});
type AddQuestionareFieldOutputFromVariableDropFields = z.infer<
	typeof addQuestionareFieldCodecFromVariableDropFields.outputSchema
>;
type _addQuestionareVariableDropFieldsIdIsNotUnknown = AssertFalse<
	IsUnknown<AddQuestionareFieldOutputFromVariableDropFields["id"]>
>;
type _addQuestionareVariableDropFieldsIdMatches = Assert<
	AddQuestionareFieldOutputFromVariableDropFields["id"] extends
		| number
		| undefined
		? true
		: false
>;

void _widenedArrayCheck;
void _strictArrayMappedCheck;
void _pipedDateToIsoOutput;
void _looseNestedPacked;
void _looseNestedDefaultB;
void _looseNestedDefaultC;
void _evenLooserQuestionareQ1;
void _evenLooserQuestionareQ2;
void _evenLooserQuestionareFirstQAnswer;
void _evenLooserQuestionareId;
void _evenLooserQuestionareDate;
void _evenLooserTuplePathFirstQAnswer;
void _addQuestionareFieldValue;
void questionnaireAnswersItemShape;
void questionnaireAnswersItemShapeWithWrongKey;
