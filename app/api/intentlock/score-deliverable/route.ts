import type { NextRequest } from "next/server";
import { errorResponse, json, parseJson } from "@/lib/intentlock/http";
import { scoreDeliverable } from "@/lib/intentlock/policy";
import { paidPost } from "@/lib/intentlock/payment";
import { deliverableSchema } from "@/lib/intentlock/schemas";

async function handler(request: NextRequest) {
  try {
    const input = await parseJson(request, deliverableSchema);
    return json(await scoreDeliverable(input));
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = paidPost(handler);
