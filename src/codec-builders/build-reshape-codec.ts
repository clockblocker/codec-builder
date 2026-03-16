import { z } from "zod";
import type { Codec, SchemaShapeOf } from "../core/types";

export function buildReshapeCodec<
	TInputSchema extends z.AnyZodObject,
	const TFieldName extends string,
	TFieldSchema extends z.ZodTypeAny,
	const TDropFields extends readonly SchemaKeys<TInputSchema>[] = [],
>(
	inputSchema: TInputSchema,
	config: ReshapeCodecConfig<
		TInputSchema,
		TFieldName,
		TFieldSchema,
		TDropFields
	>,
) {
	const { fieldName, fieldSchema, dropFields, construct, reconstruct } = config;
	const dropFieldSet = new Set<string>((dropFields ?? []) as string[]);

	if (fieldName in inputSchema.shape) {
		throw new Error(
			`Cannot add field "${fieldName}" because it already exists in the input schema.`,
		);
	}

	const shapeWithoutDroppedEntries = Object.entries(inputSchema.shape).filter(
		([key]) => !dropFieldSet.has(key),
	);
	const shapeWithoutDropped = Object.fromEntries(shapeWithoutDroppedEntries);

	type OutputShape = OutputSchemaShape<
		TInputSchema,
		TFieldName,
		TFieldSchema,
		TDropFields
	>;

	const outputSchema = z.object({
		...shapeWithoutDropped,
		[fieldName]: fieldSchema,
	} as OutputShape) as z.ZodObject<OutputShape>;

	type InputType = z.infer<TInputSchema>;
	type OutputType = z.infer<typeof outputSchema>;

	const fromInput = (data: InputType): OutputType => {
		const constructedField = construct(data);
		const result = {
			...data,
			[fieldName]: constructedField,
		} as Record<string, unknown>;

		for (const dropField of dropFieldSet) {
			delete result[dropField];
		}

		return result as OutputType;
	};

	const fromOutput = (data: OutputType): InputType => {
		const reconstructedFields = reconstruct(
			data[fieldName],
			data as OutputWithAddedField<
				TInputSchema,
				TFieldName,
				TFieldSchema,
				TDropFields
			>,
		);

		const result: Record<string, unknown> = {
			...(data as Record<string, unknown>),
			...(reconstructedFields as Record<string, unknown>),
		};
		delete result[fieldName];

		return result as InputType;
	};

	return {
		inputSchema,
		outputSchema,
		fromInput,
		fromOutput,
	} satisfies Codec<TInputSchema, typeof outputSchema>;
}

// -- Internals --

type IsTuple<T extends readonly unknown[]> = number extends T["length"]
	? false
	: true;

type SchemaKeys<TInputSchema extends z.AnyZodObject> = Extract<
	keyof SchemaShapeOf<TInputSchema>,
	string
>;

type OutputSchemaShape<
	TInputSchema extends z.AnyZodObject,
	TFieldName extends string,
	TFieldSchema extends z.ZodTypeAny,
	TDropFields extends readonly SchemaKeys<TInputSchema>[],
> =
	IsTuple<TDropFields> extends true
		? Omit<SchemaShapeOf<TInputSchema>, TDropFields[number]> &
				Record<TFieldName, TFieldSchema>
		: SchemaShapeOf<TInputSchema> & Record<TFieldName, TFieldSchema>;

type OutputWithAddedField<
	TInputSchema extends z.AnyZodObject,
	TFieldName extends string,
	TFieldSchema extends z.ZodTypeAny,
	TDropFields extends readonly SchemaKeys<TInputSchema>[],
> =
	IsTuple<TDropFields> extends true
		? Omit<z.infer<TInputSchema>, TDropFields[number]> &
				Record<TFieldName, z.output<TFieldSchema>>
		: Partial<Pick<z.infer<TInputSchema>, TDropFields[number]>> &
				Partial<Omit<z.infer<TInputSchema>, TDropFields[number]>> &
				Record<TFieldName, z.output<TFieldSchema>>;

type ReconstructedInputWithDroppedFields<
	TInputSchema extends z.AnyZodObject,
	TDropFields extends readonly SchemaKeys<TInputSchema>[],
> =
	IsTuple<TDropFields> extends true
		? Required<Pick<z.infer<TInputSchema>, TDropFields[number]>> &
				Partial<Omit<z.infer<TInputSchema>, TDropFields[number]>>
		: Partial<z.infer<TInputSchema>>;

type ReshapeCodecConfig<
	TInputSchema extends z.AnyZodObject,
	TFieldName extends string,
	TFieldSchema extends z.ZodTypeAny,
	TDropFields extends readonly SchemaKeys<TInputSchema>[],
> = {
	fieldName: TFieldName;
	fieldSchema: TFieldSchema;
	dropFields?: TDropFields;
	construct: (input: z.infer<TInputSchema>) => z.output<TFieldSchema>;
	reconstruct: (
		fieldValue: z.output<TFieldSchema>,
		output: OutputWithAddedField<
			TInputSchema,
			TFieldName,
			TFieldSchema,
			TDropFields
		>,
	) => ReconstructedInputWithDroppedFields<TInputSchema, TDropFields>;
};

// --- Inference check ---

type IsUnknown<T> = unknown extends T
	? [T] extends [unknown]
		? true
		: false
	: false;
type Assert<T extends true> = T;
type AssertFalse<T extends false> = T;

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

const addQuestionareFieldCodec = buildReshapeCodec(questionnaireServerSchema, {
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
});

buildReshapeCodec(questionnaireServerSchema, {
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
const addQuestionareFieldCodecFromVariableDropFields = buildReshapeCodec(
	questionnaireServerSchema,
	{
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
	},
);
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

void _addQuestionareFieldValue;
