import type { NextRequest } from "next/server";
import { errorResponse, json, parseJson } from "@/lib/intentlock/http";
import { createMandate } from "@/lib/intentlock/policy";
import { paidPost } from "@/lib/intentlock/payment";
import { createMandateSchema } from "@/lib/intentlock/schemas";

async function handler(request: NextRequest) {
  try {
    const input = await parseJson(request, createMandateSchema);
    return json(await createMandate(input));
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = paidPost(handler);
