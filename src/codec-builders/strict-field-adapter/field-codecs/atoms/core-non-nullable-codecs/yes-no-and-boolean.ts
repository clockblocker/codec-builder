import { z } from "zod/v4";

// The "Yes"/"No" side accepts any string as input and types its output as
// "Yes" | "No". So a z.string() source field fits, and the encode direction
// (which produces "Yes" or "No") fits a z.enum(["Yes", "No"]) source field.
const yesNoSchema = z.string().pipe(z.enum(["Yes", "No"]));

export const yesNoAndBoolean = z.codec(z.boolean(), yesNoSchema, {
	decode: (value) => (value ? "Yes" : "No"),
	encode: (value) => value === "Yes",
});
