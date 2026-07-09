import type { NextRequest } from "next/server";
import { errorResponse, json, parseJson } from "@/lib/intentlock/http";
import { generateDisputePacket } from "@/lib/intentlock/policy";
import { paidPost } from "@/lib/intentlock/payment";
import { disputeSchema } from "@/lib/intentlock/schemas";

async function handler(request: NextRequest) {
  try {
    const input = await parseJson(request, disputeSchema);
    return json(await generateDisputePacket(input.mandateId));
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = paidPost(handler);
