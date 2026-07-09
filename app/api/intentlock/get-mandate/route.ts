import type { NextRequest } from "next/server";
import { z } from "zod";
import { getMandate } from "@/lib/intentlock/store";
import { errorResponse, json, parseJson } from "@/lib/intentlock/http";
import { paidPost } from "@/lib/intentlock/payment";

const schema = z.object({ mandateId: z.string().min(1) });

async function handler(request: NextRequest) {
  try {
    const input = await parseJson(request, schema);
    const mandate = await getMandate(input.mandateId);
    return json({ mandate });
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = paidPost(handler);
