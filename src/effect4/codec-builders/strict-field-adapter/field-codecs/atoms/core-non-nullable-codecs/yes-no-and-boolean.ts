import { Schema, SchemaGetter } from "effect";

// Effect has one Encoded type for what a schema accepts and what it encodes
// to, so the "Yes"/"No" side is the literal union (the Zod codecs accept any
// string here). A source field holding "Yes" | "No" fits in both directions.
const yesNoSchema = Schema.Literals(["Yes", "No"]);

export const booleanAndYesNo = yesNoSchema.pipe(
	Schema.decodeTo(Schema.Boolean, {
		decode: SchemaGetter.transform((value) => value === "Yes"),
		encode: SchemaGetter.transform((value) => (value ? "Yes" : "No")),
	}),
);

export const yesNoAndBoolean = Schema.flip(booleanAndYesNo);
