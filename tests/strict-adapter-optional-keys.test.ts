import { describe, expect, test } from "bun:test";
import { z } from "zod/v4";
import { codecBuilder } from "../src";
import type { Equal, Expect } from "./type-helpers";

const c = codecBuilder.fieldCodec;

const row = z.object({
	id: z.number(),
	nick: z.string().optional(),
	born: z.iso.datetime().optional(),
	address: z.object({ street: z.string() }).optional(),
	tags: z.array(z.string()).optional(),
	name: z.string().nullish(),
});

const codec = codecBuilder.buildStrictFieldAdapterCodec(row, {
	id: c.noOp,
	nick: c.noOp,
	born: c.optional.date.and.isoString,
	address: { street: c.noOp },
	tags: c.arrayOf(c.noOp),
	name: c.nullable.string.and.string,
});

type Expected = {
	id: number;
	nick?: string | undefined;
	born?: Date | undefined;
	address?: { street: string } | undefined;
	tags?: string[] | undefined;
	name: string | null;
};
type _output = Expect<Equal<z.output<typeof codec>, Expected>>;
type _outSchema = Expect<Equal<z.output<typeof codec.out>, Expected>>;

type ApiUser = {
	id: number;
	nick?: string;
	born?: string;
	address?: { street: string };
	tags?: string[];
	name?: string | null;
};

const adapter = codecBuilder.buildStrictFieldAdapter<ApiUser>()({
	id: c.noOp,
	nick: c.noOp,
	born: c.optional.date.and.isoString,
	address: { street: c.noOp },
	tags: c.arrayOf(c.noOp),
	name: c.nullable.string.and.string,
});

type _adapterOutput = Expect<
	Equal<ReturnType<typeof adapter.decode>, Expected>
>;

describe("optional keys", () => {
	test("a missing key stays missing in decode and encode", () => {
		const decoded = codec.decode({ id: 1 });
		// nullable.string.and.string turns a missing value into null
		expect(decoded).toEqual({ id: 1, name: null });
		expect(Object.keys(decoded).sort()).toEqual(["id", "name"]);

		const encoded = codec.encode({ id: 1, name: null });
		expect(Object.keys(encoded).sort()).toEqual(["id", "name"]);
	});

	test("a present key stays present, even when it is undefined", () => {
		const decoded = codec.decode({ id: 1, nick: undefined, name: "a" });
		expect(Object.keys(decoded).sort()).toEqual(["id", "name", "nick"]);
	});

	test("present optional values are still converted", () => {
		const input = {
			id: 1,
			nick: "n",
			born: "2024-01-02T00:00:00.000Z",
			address: { street: "Main" },
			tags: ["t"],
			name: "a",
		};
		const decoded = codec.decode(input);
		expect(decoded.born).toEqual(new Date("2024-01-02"));
		expect(codec.encode(decoded)).toEqual(input);
	});

	test("the derived schema accepts the missing keys", () => {
		expect(codec.out.safeParse({ id: 1, name: null }).success).toBeTrue();
	});

	test("the schema-free adapter keeps missing keys missing", () => {
		const decoded = adapter.decode({ id: 1 });
		expect(decoded).toEqual({ id: 1, name: null });
		expect(Object.keys(decoded).sort()).toEqual(["id", "name"]);
		expect(
			Object.keys(adapter.encode({ id: 1, name: null })).sort(),
		).toEqual(["id", "name"]);
	});
});
