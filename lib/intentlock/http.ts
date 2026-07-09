import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const body = await request.json();
  return schema.parse(body);
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return json({ error: "Invalid request", issues: error.issues }, { status: 400 });
  }
  if (error instanceof Error) {
    return json({ error: error.message }, { status: 400 });
  }
  return json({ error: "Unknown error" }, { status: 500 });
}
