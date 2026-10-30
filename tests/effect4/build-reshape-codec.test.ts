import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect, ExpectFalse } from "../type-helpers";

const { buildReshapeCodec } = codecBuilder;
const c = codecBuilder.fieldCodec;

// -- Assertions --

type IsUnknown<T> = unknown extends T
	? [T] extends [unknown]
		? true
		: false
	: false;

const questionnaireRow = Schema.Struct({
	ans_to_q1: Schema.String,
	comment_to_q1_: Schema.String,
	id: Schema.Number,
	dateOfConstruction: Schema.String,
	answers: Schema.Array(
		Schema.Struct({
			ans_to_q2: Schema.String,
			comment_to_q2_: Schema.String,
		}),
	),
});

const answer = Schema.Struct({ answer: Schema.String, comment: Schema.String });
const questionnaireSchema = Schema.Struct({ q1: answer, q2: answer });

const questionnaireCodec = buildReshapeCodec(questionnaireRow, {
	fieldName: "questionnaire",
	fieldSchema: questionnaireSchema,
	dropFields: ["ans_to_q1", "comment_to_q1_", "answers"],
	construct: (input) => ({
		q1: { answer: input.ans_to_q1, comment: input.comment_to_q1_ },
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

buildReshapeCodec(questionnaireRow, {
	fieldName: "questionnaire",
	fieldSchema: questionnaireSchema,
	dropFields: ["ans_to_q1", "comment_to_q1_", "answers"],
	construct: (input) => ({
		q1: { answer: input.ans_to_q1, comment: input.comment_to_q1_ },
		q2: { answer: "", comment: "" },
	}),
	// @ts-expect-error reconstruct must return every dropped source field
	reconstruct: (questionnaire) => ({
		ans_to_q1: questionnaire.q1.answer,
		comment_to_q1_: questionnaire.q1.comment,
	}),
});

type Reshaped = typeof questionnaireCodec.Type;
type _reshaped = Expect<
	Equal<
		Reshaped,
		{
			readonly id: number;
			readonly dateOfConstruction: string;
			readonly questionnaire: {
				readonly q1: {
					readonly answer: string;
					readonly comment: string;
				};
				readonly q2: {
					readonly answer: string;
					readonly comment: string;
				};
			};
		}
	>
>;
type _encoded = Expect<
	Equal<typeof questionnaireCodec.Encoded, typeof questionnaireRow.Encoded>
>;
type _from = Expect<
	Equal<typeof questionnaireCodec.from, typeof questionnaireRow>
>;
type _toIsDerived = Expect<Equal<typeof questionnaireCodec.to.Type, Reshaped>>;
// @ts-expect-error a dropped source key is not in the output
const droppedKey: Reshaped["ans_to_q1"] = "Yes";

// A `string[]` variable still drops the fields at runtime, but the types
// can't tell which, so the output type keeps them.
const dropFromVariable: Array<keyof typeof questionnaireRow.Type> = [
	"ans_to_q1",
	"comment_to_q1_",
	"answers",
];
const fromVariable = buildReshapeCodec(questionnaireRow, {
	fieldName: "questionnaire",
	fieldSchema: questionnaireSchema,
	dropFields: dropFromVariable,
	construct: (input) => ({
		q1: { answer: input.ans_to_q1, comment: input.comment_to_q1_ },
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
type FromVariable = typeof fromVariable.Type;
type _variableIdIsNotUnknown = ExpectFalse<IsUnknown<FromVariable["id"]>>;
type _variableKeepsDropped = Expect<Equal<FromVariable["ans_to_q1"], string>>;

const row = {
	ans_to_q1: "Yes",
	comment_to_q1_: "Because",
	id: 1,
	dateOfConstruction: "2024-01-01",
	answers: [{ ans_to_q2: "No", comment_to_q2_: "Later" }],
} satisfies typeof questionnaireRow.Encoded;

const reshaped = {
	id: 1,
	dateOfConstruction: "2024-01-01",
	questionnaire: {
		q1: { answer: "Yes", comment: "Because" },
		q2: { answer: "No", comment: "Later" },
	},
} satisfies Reshaped;

// -- Tests --

describe("buildReshapeCodec (Effect 4)", () => {
	test("constructs the new field and drops the configured source fields", () => {
		expect(Schema.decodeSync(questionnaireCodec)(row)).toEqual(reshaped);
		expect(Schema.is(questionnaireCodec.to)(reshaped)).toBeTrue();
		expect(questionnaireCodec.from).toBe(questionnaireRow);
	});

	test("reconstructs the dropped fields on encode", () => {
		expect(Schema.encodeSync(questionnaireCodec)(reshaped)).toEqual(row);
	});

	test("drops fields at runtime even when dropFields is a variable", () => {
		const output = Schema.decodeSync(fromVariable)(row);
		expect(output).toEqual(reshaped as never);
		expect("ans_to_q1" in output).toBeFalse();
		expect(Schema.encodeSync(fromVariable)(output)).toEqual(row);
	});

	test("validates both sides", () => {
		expect(
			Schema.decodeUnknownExit(questionnaireCodec)({ ...row, id: "1" })
				._tag,
		).toBe("Failure");
		expect(
			Schema.encodeUnknownExit(questionnaireCodec)({
				...reshaped,
				questionnaire: { q1: reshaped.questionnaire.q1 },
			})._tag,
		).toBe("Failure");
	});

	test("kept fields that transform pass through decoded", () => {
		const person = buildReshapeCodec(
			Schema.Struct({
				age: Schema.NumberFromString,
				first: Schema.String,
				last: Schema.String,
			}),
			{
				fieldName: "name",
				fieldSchema: Schema.String,
				dropFields: ["first", "last"],
				construct: (r) => `${r.first} ${r.last}`,
				reconstruct: (name) => {
					const [first = "", last = ""] = name.split(" ");
					return { first, last };
				},
			},
		);
		type _person = Expect<
			Equal<
				typeof person.Type,
				{ readonly age: number; readonly name: string }
			>
		>;
		const decoded = Schema.decodeSync(person)({
			age: "36",
			first: "Ada",
			last: "Lovelace",
		});
		expect(decoded).toEqual({ age: 36, name: "Ada Lovelace" });
		expect(Schema.encodeSync(person)(decoded)).toEqual({
			age: "36",
			first: "Ada",
			last: "Lovelace",
		});
	});

	test("composes with the strict adapter through pipeCodecs", () => {
		const typed = codecBuilder.buildStrictFieldAdapterCodec(
			Schema.Struct({
				first_name: Schema.String,
				last_name: Schema.String,
				vip: Schema.Literals(["Yes", "No"]),
			}),
			{
				first_name: c.noOp,
				last_name: c.noOp,
				vip: c.nonNullish.boolean.and.yesNo,
			},
		);
		const grouped = buildReshapeCodec(typed.to, {
			fieldName: "name",
			fieldSchema: Schema.String,
			dropFields: ["first_name", "last_name"],
			construct: (r) => `${r.first_name} ${r.last_name}`,
			reconstruct: (name) => {
				const [first_name = "", last_name = ""] = name.split(" ");
				return { first_name, last_name };
			},
		});
		const contact = codecBuilder.helpers.pipeCodecs(typed, grouped);
		type _contact = Expect<
			Equal<
				typeof contact.Type,
				{ readonly vip: boolean; readonly name: string }
			>
		>;
		const input = {
			first_name: "Ada",
			last_name: "Lovelace",
			vip: "Yes",
		} as const;
		expect(Schema.decodeSync(contact)(input)).toEqual({
			vip: true,
			name: "Ada Lovelace",
		});
		expect(
			Schema.encodeSync(contact)({ vip: true, name: "Ada Lovelace" }),
		).toEqual(input);
	});

	test("throws when the new field already exists", () => {
		expect(() =>
			buildReshapeCodec(questionnaireRow, {
				fieldName: "id",
				fieldSchema: Schema.Number,
				construct: (r) => r.id,
				reconstruct: () => ({}),
			}),
		).toThrow('Cannot add field "id" because it already exists');
	});
});

void droppedKey;
