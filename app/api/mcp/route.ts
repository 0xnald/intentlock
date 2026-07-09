import type { NextRequest } from "next/server";
import { json } from "@/lib/intentlock/http";
import {
  checkPaymentRequest,
  createMandate,
  generateDisputePacket,
  scoreDeliverable,
  validateAgentAction
} from "@/lib/intentlock/policy";
import { paidPost } from "@/lib/intentlock/payment";
import { getMandate, listReceipts } from "@/lib/intentlock/store";
import {
  actionSchema,
  createMandateSchema,
  deliverableSchema,
  disputeSchema,
  paymentSchema
} from "@/lib/intentlock/schemas";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: {
    name?: string;
    arguments?: unknown;
  };
};

const tools = [
  {
    name: "create_mandate",
    description:
      "Create an enforceable mandate before an AI agent spends money, hires a provider, or starts paid work.",
    inputSchema: {
      type: "object",
      required: ["userIntent"],
      properties: {
        userIntent: { type: "string" },
        agent: { type: "string" },
        objective: { type: "string" },
        currency: { type: "string", enum: ["USDt", "OKB", "USD"] },
        maxBudget: { type: "number" },
        maxPerCall: { type: "number" },
        allowedProviders: { type: "array", items: { type: "string" } },
        blockedActions: { type: "array", items: { type: "string" } },
        requireEscrow: { type: "boolean" },
        requiredEvidence: { type: "array", items: { type: "string" } },
        acceptanceCriteria: { type: "array", items: { type: "string" } },
        deadline: { type: "string" },
        maxRevisions: { type: "number" }
      }
    }
  },
  {
    name: "validate_agent_action",
    description: "Decide whether a planned agent action is allowed under an existing mandate.",
    inputSchema: {
      type: "object",
      required: ["mandateId", "action"],
      properties: {
        mandateId: { type: "string" },
        action: { type: "string" },
        provider: { type: "string" },
        amount: { type: "number" },
        evidence: { type: "array", items: { type: "string" } }
      }
    }
  },
  {
    name: "check_payment_request",
    description: "Approve, block, or require user approval for an agent payment request.",
    inputSchema: {
      type: "object",
      required: ["mandateId", "provider", "amount", "purpose"],
      properties: {
        mandateId: { type: "string" },
        provider: { type: "string" },
        amount: { type: "number" },
        purpose: { type: "string" }
      }
    }
  },
  {
    name: "score_deliverable",
    description: "Evaluate whether a provider deliverable satisfies mandate acceptance criteria.",
    inputSchema: {
      type: "object",
      required: ["mandateId", "summary", "artifacts", "evidence"],
      properties: {
        mandateId: { type: "string" },
        summary: { type: "string" },
        artifacts: { type: "array", items: { type: "string" } },
        evidence: { type: "array", items: { type: "string" } }
      }
    }
  },
  {
    name: "generate_dispute_packet",
    description: "Collect mandate, receipts, and evidence into a structured dispute packet.",
    inputSchema: {
      type: "object",
      required: ["mandateId"],
      properties: {
        mandateId: { type: "string" }
      }
    }
  },
  {
    name: "get_mandate",
    description: "Retrieve a mandate by ID.",
    inputSchema: {
      type: "object",
      required: ["mandateId"],
      properties: {
        mandateId: { type: "string" }
      }
    }
  },
  {
    name: "list_receipts",
    description: "List IntentLock receipts, optionally scoped to a mandate.",
    inputSchema: {
      type: "object",
      properties: {
        mandateId: { type: "string" }
      }
    }
  }
];

async function callTool(name: string, args: unknown) {
  switch (name) {
    case "create_mandate":
      return createMandate(createMandateSchema.parse(args));
    case "validate_agent_action":
      return validateAgentAction(actionSchema.parse(args));
    case "check_payment_request":
      return checkPaymentRequest(paymentSchema.parse(args));
    case "score_deliverable":
      return scoreDeliverable(deliverableSchema.parse(args));
    case "generate_dispute_packet": {
      const input = disputeSchema.parse(args);
      return generateDisputePacket(input.mandateId);
    }
    case "get_mandate": {
      const input = disputeSchema.parse(args);
      return { mandate: await getMandate(input.mandateId) };
    }
    case "list_receipts": {
      const input = disputeSchema.partial().parse(args);
      return { receipts: await listReceipts(input.mandateId) };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handler(request: NextRequest) {
  const message = (await request.json()) as JsonRpcRequest;

  if (message.method === "initialize") {
    return json({
      jsonrpc: "2.0",
      id: message.id ?? null,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: {
          name: "IntentLock",
          version: "0.1.0"
        }
      }
    });
  }

  if (message.method === "tools/list") {
    return json({
      jsonrpc: "2.0",
      id: message.id ?? null,
      result: { tools }
    });
  }

  if (message.method === "tools/call") {
    try {
      const name = message.params?.name;
      if (!name) {
        throw new Error("Missing tool name.");
      }
      const result = await callTool(name, message.params?.arguments ?? {});
      return json({
        jsonrpc: "2.0",
        id: message.id ?? null,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ],
          structuredContent: result
        }
      });
    } catch (error) {
      return json({
        jsonrpc: "2.0",
        id: message.id ?? null,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : "Tool call failed."
        }
      });
    }
  }

  return json({
    jsonrpc: "2.0",
    id: message.id ?? null,
    error: {
      code: -32601,
      message: `Unsupported method: ${message.method ?? "missing"}`
    }
  });
}

export const POST = paidPost(handler);
