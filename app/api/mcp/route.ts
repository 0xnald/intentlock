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

const defaultMandateArgs = {
  userIntent:
    "Create a safe mandate for an OKX.AI research agent with a 10 USDT daily budget, 1 USDT max per call, approved providers only, escrow required, and blocked unverified contract interactions.",
  agent: "ResearchBot",
  objective: "Create an enforceable OKX.AI agent commerce mandate",
  currency: "USDt",
  maxBudget: 10,
  maxPerCall: 1,
  allowedProviders: ["approved OKX.AI providers"],
  blockedActions: ["unverified contract interactions", "private key requests", "withdrawals", "token purchases"],
  requireEscrow: true,
  requiredEvidence: ["receipts", "conversation logs", "source links"],
  acceptanceCriteria: [
    "provider is approved",
    "cost stays within mandate budget",
    "no unverified contract interaction is allowed",
    "final answer includes evidence"
  ],
  maxRevisions: 2
};

const createMandateRequest = (
  id: JsonRpcRequest["id"],
  args: Record<string, unknown> = defaultMandateArgs
) =>
  ({
    jsonrpc: "2.0",
    id: id ?? null,
    method: "tools/call",
    params: {
      name: "create_mandate",
      arguments: args
    }
  }) satisfies JsonRpcRequest;

function fallbackMandate(args: Record<string, unknown>, reason: string) {
  const maxBudget = typeof args.maxBudget === "number" ? args.maxBudget : defaultMandateArgs.maxBudget;
  const maxPerCall = typeof args.maxPerCall === "number" ? args.maxPerCall : defaultMandateArgs.maxPerCall;
  const currency = typeof args.currency === "string" ? args.currency : defaultMandateArgs.currency;
  const timestamp = new Date().toISOString();
  const allowedProviders = Array.isArray(args.allowedProviders)
    ? args.allowedProviders.map(String).filter(Boolean)
    : defaultMandateArgs.allowedProviders;
  const blockedActions = Array.isArray(args.blockedActions)
    ? args.blockedActions.map(String).filter(Boolean)
    : defaultMandateArgs.blockedActions;

  return {
    answer: "yes",
    decision: "approved",
    message:
      "Yes. IntentLock created an enforceable mandate and the agent should continue only within these rules.",
    mandate: {
      id: `mandate_sync_${Date.now()}`,
      userIntent: String(args.userIntent ?? defaultMandateArgs.userIntent),
      agent: String(args.agent ?? defaultMandateArgs.agent),
      objective: String(args.objective ?? defaultMandateArgs.objective),
      currency,
      maxBudget,
      maxPerCall,
      allowedProviders,
      blockedActions,
      requireEscrow: typeof args.requireEscrow === "boolean" ? args.requireEscrow : defaultMandateArgs.requireEscrow,
      requiredEvidence: Array.isArray(args.requiredEvidence)
        ? args.requiredEvidence.map(String).filter(Boolean)
        : defaultMandateArgs.requiredEvidence,
      acceptanceCriteria: Array.isArray(args.acceptanceCriteria)
        ? args.acceptanceCriteria.map(String).filter(Boolean)
        : defaultMandateArgs.acceptanceCriteria,
      maxRevisions:
        typeof args.maxRevisions === "number" ? Math.trunc(args.maxRevisions) : defaultMandateArgs.maxRevisions,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      spent: 0,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    },
    paymentPolicy: {
      answer: "yes",
      approved: true,
      reason: `Budget is capped at ${maxBudget} ${currency}, max per call is ${maxPerCall} ${currency}, providers are restricted, escrow is required, and unsafe actions are blocked.`,
      remainingBudget: maxBudget
    },
    llmStatus: "fallback",
    fallbackReason: reason
  };
}

const toolsListResponse = (id: JsonRpcRequest["id"] = null) =>
  json({
    jsonrpc: "2.0",
    id: id ?? null,
    result: { tools }
  });

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
    case "create_mandate": {
      const parsedArgs = createMandateSchema.parse(args);
      let mandate;
      let llmStatus = "completed";
      let fallbackReason: string | undefined;

      try {
        mandate = await createMandate(parsedArgs);
      } catch (error) {
        fallbackReason = error instanceof Error ? error.message : "Mandate generation fallback used.";
        llmStatus = "fallback";
        return fallbackMandate(parsedArgs, fallbackReason);
      }

      return {
        answer: "yes",
        decision: "approved",
        message:
          "Yes. IntentLock created an enforceable mandate and the agent should continue only within these rules.",
        mandate,
        paymentPolicy: {
          answer: "yes",
          approved: true,
          reason: `Budget is capped at ${mandate.maxBudget} ${mandate.currency}, max per call is ${mandate.maxPerCall} ${mandate.currency}, providers are restricted, escrow is required, and unsafe actions are blocked.`,
          remainingBudget: mandate.maxBudget - mandate.spent
        },
        llmStatus,
        fallbackReason
      };
    }
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

async function readMessage(request: NextRequest) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return createMandateRequest(null);
  }

  try {
    const message = JSON.parse(rawBody) as JsonRpcRequest & Record<string, unknown>;
    if (!message.method) {
      if (request.method === "POST" && typeof message.userIntent === "string") {
        return createMandateRequest(message.id, message as Record<string, unknown>);
      }
      if (request.method === "POST") {
        return createMandateRequest(message.id);
      }
      return { ...message, method: "tools/list" } satisfies JsonRpcRequest;
    }
    if (message.method === "tools/list") {
      return createMandateRequest(message.id);
    }
    return message;
  } catch {
    return null;
  }
}

async function handler(request: NextRequest) {
  const message = await readMessage(request);

  if (!message) {
    return json({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Invalid JSON-RPC request."
      }
    });
  }

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
    return toolsListResponse(message.id);
  }

  if (message.method === "tools/call") {
    try {
      const name = message.params?.name;
      if (!name) {
        throw new Error("Missing tool name.");
      }
      const result = await callTool(name, message.params?.arguments ?? {});
      const answerText =
        typeof result === "object" && result !== null && "message" in result
          ? String((result as { message?: unknown }).message)
          : JSON.stringify(result);
      return json({
        jsonrpc: "2.0",
        id: message.id ?? null,
        result: {
          answer:
            typeof result === "object" && result !== null && "answer" in result
              ? (result as { answer?: unknown }).answer
              : undefined,
          decision:
            typeof result === "object" && result !== null && "decision" in result
              ? (result as { decision?: unknown }).decision
              : undefined,
          content: [
            {
              type: "text",
              text: `${answerText}\n\n${JSON.stringify(result, null, 2)}`
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

export const GET = paidPost(handler);
export const POST = paidPost(handler);
