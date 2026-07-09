import type { NextRequest } from "next/server";
import { errorResponse, json, parseJson } from "@/lib/intentlock/http";
import { validateAgentAction } from "@/lib/intentlock/policy";
import { paidPost } from "@/lib/intentlock/payment";
import { actionSchema } from "@/lib/intentlock/schemas";

async function handler(request: NextRequest) {
  try {
    const input = await parseJson(request, actionSchema);
    return json(await validateAgentAction(input));
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = paidPost(handler);
