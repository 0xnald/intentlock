import type { NextRequest } from "next/server";
import { z } from "zod";
import { listReceipts } from "@/lib/intentlock/store";
import { errorResponse, json, parseJson } from "@/lib/intentlock/http";
import { paidPost } from "@/lib/intentlock/payment";

const schema = z.object({ mandateId: z.string().optional() });

async function handler(request: NextRequest) {
  try {
    const input = await parseJson(request, schema);
    const receipts = await listReceipts(input.mandateId);
    return json({ receipts });
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = paidPost(handler);
