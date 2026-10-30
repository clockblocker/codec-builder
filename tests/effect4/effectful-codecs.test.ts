import { describe, expect, test } from "bun:test";
import {
	Context,
	Effect,
	Exit,
	Schema,
	SchemaGetter,
	SchemaIssue,
} from "effect";
import { codecBuilder } from "../../src/effect4";
import type { Equal, Expect } from "../type-helpers";

const c = codecBuilder.fieldCodec;
const h = codecBuilder.helpers;

// Effect transformations can be effectful (async, failing with an issue, or
// needing services). Field codecs like that work through Effect's own
// `decodeEffect`/`encodeEffect` and `decodeUnknownPromise`; there is no
// separate async API.

const runs = { decode: 0, encode: 0 };
// An async transformation in both directions, counting its runs.
const asyncNumber = Schema.String.pipe(
	Schema.decodeTo(Schema.Number, {
		decode: SchemaGetter.transformEffect((value) =>
			Effect.promise(async () => {
				runs.decode++;
				await Bun.sleep(1);
				return Number(value);
			}),
		),
		encode: SchemaGetter.transformEffect((value) =>
			Effect.sleep("1 millis").pipe(
				Effect.map(() => {
					runs.encode++;
					return String(value);
				}),
			),
		),
	}),
);
// A transformation that fails with an issue, asynchronously.
const nonNegative = Schema.String.pipe(
	Schema.decodeTo(Schema.Number, {
		decode: SchemaGetter.transformEffect((value) =>
			Effect.sleep("1 millis").pipe(
				Effect.flatMap(() =>
					Number(value) >= 0
						? Effect.succeed(Number(value))
						: Effect.fail(
								new SchemaIssue.InvalidValue(
									{ message: "must not be negative" },
									value,
								),
							),
				),
			),
		),
		encode: SchemaGetter.transform(String),
	}),
);

const row = Schema.Struct({
	id: Schema.Number,
	balance: Schema.String,
	nested: Schema.Struct({ amount: Schema.String }),
	items: Schema.Array(Schema.Struct({ price: Schema.String })),
	note: Schema.optional(Schema.String),
	vip: Schema.Literals(["Yes", "No"]),
});

const codec = codecBuilder.buildStrictFieldAdapterCodec(row, {
	id: c.noOp,
	balance: asyncNumber,
	nested: { amount: asyncNumber },
	items: c.arrayOf({ price: nonNegative }),
	note: h.toOptional(asyncNumber),
	vip: c.nonNullish.boolean.and.yesNo,
});

const input = {
	id: 1,
	balance: "12.5",
	nested: { amount: "3" },
	items: [{ price: "1" }, { price: "2" }],
	vip: "Yes" as const,
};
const output = {
	id: 1,
	balance: 12.5,
	nested: { amount: 3 },
	items: [{ price: 1 }, { price: 2 }],
	vip: true,
};

const failurePaths = (exit: Exit.Exit<unknown, Schema.SchemaError>) => {
	if (Exit.isSuccess(exit)) return undefined;
	const error = exit.cause.reasons.find((reason) => reason._tag === "Fail");
	const issue = (error as { error: Schema.SchemaError } | undefined)?.error
		.issue;
	return issue === undefined
		? undefined
		: SchemaIssue.makeFormatterStandardSchemaV1()(issue).issues.map(
				(entry) => entry.path,
			);
};

describe("effectful field codecs", () => {
	test("decodeEffect and encodeEffect run them, in nested shapes and arrayOf", async () => {
		const decoded = await Effect.runPromise(
			Schema.decodeEffect(codec)(input),
		);
		expect(decoded).toEqual(output);
		expect("note" in decoded).toBeFalse();
		expect(
			await Effect.runPromise(Schema.encodeEffect(codec)(output)),
		).toEqual(input);
		expect(
			await Schema.decodeUnknownPromise(codec)({ ...input, note: "3" }),
		).toEqual({ ...output, note: 3 });
	});

	test("each transformation runs once per field", async () => {
		runs.decode = 0;
		runs.encode = 0;
		await Schema.decodeUnknownPromise(codec)(input);
		expect(runs).toEqual({ decode: 2, encode: 0 });
		await Schema.encodeUnknownPromise(codec)(output);
		expect(runs).toEqual({ decode: 2, encode: 2 });
	});

	test("failures are SchemaErrors with their path", async () => {
		const exit = await Effect.runPromiseExit(
			Schema.decodeUnknownEffect(codec)({
				...input,
				items: [{ price: "1" }, { price: "-2" }],
			}),
		);
		expect(failurePaths(exit)).toEqual([["items", 1, "price"]]);
		await expect(
			Schema.decodeUnknownPromise(codec)({
				...input,
				items: [{ price: "-1" }],
			}),
		).rejects.toThrow("must not be negative");
	});

	test("the sync APIs throw when they reach an async step", async () => {
		expect(() => Schema.decodeUnknownSync(codec)(input)).toThrow();
		expect(() => Schema.encodeUnknownSync(codec)(output)).toThrow();
		// Effect does not interrupt the fiber it gave up on; let it finish so
		// its runs don't count in later tests.
		await Bun.sleep(20);
	});

	test("a sync-only codec decodes with either API", async () => {
		const sync = codecBuilder.buildStrictFieldAdapterCodec(
			Schema.Struct({ vip: Schema.Literals(["Yes", "No"]) }),
			{ vip: c.nonNullish.boolean.and.yesNo },
		);
		expect(Schema.decodeSync(sync)({ vip: "No" })).toEqual({ vip: false });
		expect(await Schema.decodeUnknownPromise(sync)({ vip: "No" })).toEqual({
			vip: false,
		});
	});
});

describe("codecs that need services", () => {
	const Rate = Context.Service<{ readonly rate: number }>("test/Rate");
	const scaled = Schema.Number.pipe(
		Schema.decodeTo(Schema.Number, {
			decode: SchemaGetter.transformEffect((value) =>
				Effect.gen(function* () {
					const { rate } = yield* Rate;
					return value * rate;
				}),
			),
			encode: SchemaGetter.transform((value) => value),
		}),
	);
	const priced = codecBuilder.buildStrictFieldAdapterCodec(
		Schema.Struct({
			amount: Schema.Number,
			lines: Schema.Array(Schema.Number),
		}),
		{ amount: scaled, lines: c.arrayOf(scaled) },
	);

	type _decodingServices = Expect<
		Equal<typeof priced.DecodingServices, typeof Rate.Identifier>
	>;
	type _encodingServices = Expect<
		Equal<typeof priced.EncodingServices, never>
	>;

	test("services reach the codec through the struct", async () => {
		const decoded = await Effect.runPromise(
			Schema.decodeEffect(priced)({ amount: 2, lines: [1, 3] }).pipe(
				Effect.provideService(Rate, { rate: 10 }),
			),
		);
		expect(decoded).toEqual({ amount: 20, lines: [10, 30] });
	});
});

describe("effectful codecs in the helpers", () => {
	test("casters and pipeCodecs run them", async () => {
		runs.decode = 0;
		expect(
			await Schema.decodeUnknownPromise(h.toNullable(asyncNumber))("1"),
		).toBe(1);
		expect(
			await Schema.decodeUnknownPromise(h.toNullable(asyncNumber))(
				undefined,
			),
		).toBeNull();
		expect(
			await Schema.decodeUnknownPromise(h.toArrayOf(asyncNumber))([
				"1",
				"2",
			]),
		).toEqual([1, 2]);
		expect(
			await Schema.decodeUnknownPromise(
				h.toNonNullishWithDefault(h.toNullable(asyncNumber), 0),
			)(null),
		).toBe(0);
		expect(runs.decode).toBe(3);

		const piped = h.pipeCodecs(
			asyncNumber,
			c.nonNullish.numericString.and.number,
		);
		expect(await Schema.decodeUnknownPromise(piped)("12")).toBe("12");
		expect(await Schema.encodeUnknownPromise(piped)("7")).toBe("7");
	});
});
