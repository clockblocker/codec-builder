import { Result, Schema, SchemaIssue } from "effect";

// Turns a failed decode or encode into `{ path, message }` pairs (every
// issue, not only the first), for assertions on error paths.

type Issue = { path: readonly PropertyKey[]; message: string };

const format = SchemaIssue.makeFormatterStandardSchemaV1();

function issuesOf(
	result: Result.Result<unknown, Schema.SchemaError>,
): Issue[] | undefined {
	if (Result.isSuccess(result)) return undefined;
	return format(result.failure.issue).issues.map((issue) => ({
		path: (issue.path ?? []).map((segment) =>
			typeof segment === "object" ? segment.key : segment,
		),
		message: issue.message,
	}));
}

export function decodeIssues(
	schema: Schema.Codec<unknown, unknown>,
	input: unknown,
): Issue[] | undefined {
	return issuesOf(
		Schema.decodeUnknownResult(schema)(input, { errors: "all" }),
	);
}

export function encodeIssues(
	schema: Schema.Codec<unknown, unknown>,
	input: unknown,
): Issue[] | undefined {
	return issuesOf(
		Schema.encodeUnknownResult(schema)(input, { errors: "all" }),
	);
}

export const paths = (issues: Issue[] | undefined) =>
	issues?.map((issue) => issue.path);
