import type { NextRequest } from "next/server";
import { errorResponse, json, parseJson } from "@/lib/intentlock/http";
import { checkPaymentRequest } from "@/lib/intentlock/policy";
import { paidPost } from "@/lib/intentlock/payment";
import { paymentSchema } from "@/lib/intentlock/schemas";

async function handler(request: NextRequest) {
  try {
    const input = await parseJson(request, paymentSchema);
    return json(await checkPaymentRequest(input));
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = paidPost(handler);
