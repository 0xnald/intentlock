import { getMandate, listReceipts, saveMandate, saveReceipt } from "./store";
import { enrichMandateWithLlm } from "./llm";
import type {
  ActionInput,
  CreateMandateInput,
  Decision,
  DeliverableInput,
  Mandate,
  PaymentInput,
  Receipt
} from "./types";

const now = () => new Date().toISOString();

const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;

function normalizeList(values: string[] | undefined, fallback: string[]) {
  return values?.map((value) => value.trim()).filter(Boolean) ?? fallback;
}

function receipt(input: Omit<Receipt, "id" | "createdAt">): Receipt {
  return {
    ...input,
    id: id("rcpt"),
    createdAt: now()
  };
}

function containsBlockedAction(action: string, blockedActions: string[]) {
  const lowerAction = action.toLowerCase();
  return blockedActions.find((blocked) => lowerAction.includes(blocked.toLowerCase()));
}

function providerAllowed(provider: string | undefined, allowedProviders: string[]) {
  if (!provider) {
    return true;
  }
  return allowedProviders.some((allowed) => allowed.toLowerCase() === provider.toLowerCase());
}

function remainingBudget(mandate: Mandate) {
  return Number((mandate.maxBudget - mandate.spent).toFixed(6));
}

export async function createMandate(input: CreateMandateInput) {
  const llmMandate = await enrichMandateWithLlm(input);
  const enrichedInput = {
    ...llmMandate,
    ...input
  };
  const createdAt = now();
  const mandate: Mandate = {
    id: id("mandate"),
    userIntent: enrichedInput.userIntent,
    agent: enrichedInput.agent ?? "Agent",
    objective: enrichedInput.objective ?? enrichedInput.userIntent,
    currency: enrichedInput.currency ?? "USDt",
    maxBudget: enrichedInput.maxBudget ?? 30,
    maxPerCall: enrichedInput.maxPerCall ?? 1,
    allowedProviders: normalizeList(enrichedInput.allowedProviders, []),
    blockedActions: normalizeList(enrichedInput.blockedActions, [
      "token purchase",
      "unverified contract",
      "private key",
      "withdraw"
    ]),
    requireEscrow: enrichedInput.requireEscrow ?? true,
    requiredEvidence: normalizeList(enrichedInput.requiredEvidence, ["receipts", "conversation logs"]),
    acceptanceCriteria: normalizeList(enrichedInput.acceptanceCriteria, ["clear deliverable", "source evidence"]),
    deadline: enrichedInput.deadline,
    maxRevisions: enrichedInput.maxRevisions ?? 2,
    spent: 0,
    status: "active",
    createdAt,
    updatedAt: createdAt
  };

  await saveMandate(mandate);
  return mandate;
}

export async function validateAgentAction(input: ActionInput) {
  const mandate = await requireMandate(input.mandateId);
  const blocked = containsBlockedAction(input.action, mandate.blockedActions);

  let decision: Decision = "approved";
  let reason = "Action is inside the mandate.";

  if (mandate.status !== "active") {
    decision = "blocked";
    reason = `Mandate is ${mandate.status}.`;
  } else if (blocked) {
    decision = "blocked";
    reason = `Action contains blocked behavior: ${blocked}.`;
  } else if (!providerAllowed(input.provider, mandate.allowedProviders)) {
    decision = "blocked";
    reason = `Provider ${input.provider} is not allowlisted.`;
  } else if (typeof input.amount === "number" && input.amount > mandate.maxPerCall) {
    decision = "needs_approval";
    reason = `Amount exceeds max-per-call limit of ${mandate.maxPerCall} ${mandate.currency}.`;
  }

  const savedReceipt = await saveReceipt(
    receipt({
      mandateId: mandate.id,
      kind: "action",
      decision,
      reason,
      amount: input.amount,
      provider: input.provider,
      action: input.action,
      evidence: input.evidence
    })
  );

  return {
    decision,
    reason,
    mandateId: mandate.id,
    remainingBudget: remainingBudget(mandate),
    requiredAction: decision === "needs_approval" ? "request_user_approval" : undefined,
    receipt: savedReceipt
  };
}

export async function checkPaymentRequest(input: PaymentInput) {
  const mandate = await requireMandate(input.mandateId);
  let decision: Decision = "approved";
  let reason = "Payment request satisfies the mandate.";

  if (mandate.status !== "active") {
    decision = "blocked";
    reason = `Mandate is ${mandate.status}.`;
  } else if (!providerAllowed(input.provider, mandate.allowedProviders)) {
    decision = "blocked";
    reason = `Provider ${input.provider} is not allowlisted.`;
  } else if (input.amount > mandate.maxPerCall) {
    decision = "needs_approval";
    reason = `Payment exceeds max-per-call limit of ${mandate.maxPerCall} ${mandate.currency}.`;
  } else if (input.amount > remainingBudget(mandate)) {
    decision = "blocked";
    reason = `Payment exceeds remaining budget of ${remainingBudget(mandate)} ${mandate.currency}.`;
  }

  if (decision === "approved") {
    mandate.spent = Number((mandate.spent + input.amount).toFixed(6));
    mandate.updatedAt = now();
    await saveMandate(mandate);
  }

  const savedReceipt = await saveReceipt(
    receipt({
      mandateId: mandate.id,
      kind: "payment",
      decision,
      reason,
      amount: input.amount,
      provider: input.provider,
      action: input.purpose
    })
  );

  return {
    decision,
    reason,
    mandateId: mandate.id,
    remainingBudget: remainingBudget(mandate),
    requiredAction: decision === "needs_approval" ? "request_user_approval" : undefined,
    receipt: savedReceipt
  };
}

export async function scoreDeliverable(input: DeliverableInput) {
  const mandate = await requireMandate(input.mandateId);
  const text = `${input.summary}\n${input.artifacts.join("\n")}\n${input.evidence.join("\n")}`.toLowerCase();
  const missingCriteria = mandate.acceptanceCriteria.filter((criterion) => {
    const terms = criterion.toLowerCase().split(/\W+/).filter((term) => term.length > 3);
    return terms.length > 0 && !terms.some((term) => text.includes(term));
  });

  const missingEvidence = mandate.requiredEvidence.filter((item) => {
    const normalized = item.toLowerCase();
    return !input.evidence.some((entry) => entry.toLowerCase().includes(normalized));
  });

  const decision: Decision =
    missingCriteria.length === 0 && missingEvidence.length === 0
      ? "release"
      : missingCriteria.length <= 1
        ? "revise"
        : "dispute";

  const reason =
    decision === "release"
      ? "Deliverable satisfies acceptance criteria and evidence requirements."
      : `Missing criteria or evidence: ${[...missingCriteria, ...missingEvidence].join(", ")}.`;

  const savedReceipt = await saveReceipt(
    receipt({
      mandateId: mandate.id,
      kind: "delivery",
      decision,
      reason,
      evidence: input.evidence,
      action: input.summary
    })
  );

  return {
    decision,
    reason,
    mandateId: mandate.id,
    remainingBudget: remainingBudget(mandate),
    missingCriteria: [...missingCriteria, ...missingEvidence],
    receipt: savedReceipt
  };
}

export async function generateDisputePacket(mandateId: string) {
  const mandate = await requireMandate(mandateId);
  const receipts = await listReceipts(mandateId);
  const packet = {
    mandate,
    receipts,
    generatedAt: now(),
    summary: `Dispute evidence packet for ${mandate.agent}: ${mandate.objective}`,
    recommendedAction: receipts.some((item) => item.decision === "dispute") ? "open_arbitration" : "review_manually"
  };

  await saveReceipt(
    receipt({
      mandateId,
      kind: "dispute",
      decision: packet.recommendedAction === "open_arbitration" ? "dispute" : "needs_approval",
      reason: packet.summary,
      evidence: receipts.flatMap((item) => item.evidence ?? [])
    })
  );

  return packet;
}

async function requireMandate(mandateId: string) {
  const mandate = await getMandate(mandateId);
  if (!mandate) {
    throw new Error(`Mandate not found: ${mandateId}`);
  }
  return mandate;
}
