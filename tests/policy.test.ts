import assert from "node:assert/strict";
import {
  checkPaymentRequest,
  createMandate,
  generateDisputePacket,
  scoreDeliverable,
  validateAgentAction
} from "../lib/intentlock/policy";

process.env.LLM_API_KEY = "test-key";
process.env.LLM_BASE_URL = "https://llm.test/v1";
process.env.LLM_MODEL = "test-model";

globalThis.fetch = async () =>
  new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              objective: "Hire a logo designer with a strict budget and escrow evidence.",
              maxBudget: 30,
              maxPerCall: 5,
              allowedProviders: ["TopLogoASP"],
              blockedActions: ["unverified contract", "private key", "withdraw"],
              requireEscrow: true,
              requiredEvidence: ["receipts", "source files"],
              acceptanceCriteria: ["PNG", "SVG", "source files"],
              maxRevisions: 2
            })
          }
        }
      ]
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );

const mandate = await createMandate({
  userIntent: "Hire a logo designer with a strict budget and escrow evidence.",
  agent: "DesignBuyer"
});

const approved = await checkPaymentRequest({
  mandateId: mandate.id,
  provider: "TopLogoASP",
  amount: 3,
  purpose: "Initial design deposit"
});

assert.equal(approved.decision, "approved");
assert.equal(approved.remainingBudget, 27);

const blocked = await checkPaymentRequest({
  mandateId: mandate.id,
  provider: "UnknownASP",
  amount: 10,
  purpose: "Unapproved upsell"
});

assert.equal(blocked.decision, "blocked");

const action = await validateAgentAction({
  mandateId: mandate.id,
  action: "Interact with unverified contract before design delivery",
  provider: "TopLogoASP"
});

assert.equal(action.decision, "blocked");

const delivery = await scoreDeliverable({
  mandateId: mandate.id,
  summary: "Final logo delivered as PNG, SVG, and source files.",
  artifacts: ["logo.png", "logo.svg", "source files.zip"],
  evidence: ["receipts", "conversation logs", "source files"]
});

assert.equal(delivery.decision, "release");

const packet = await generateDisputePacket(mandate.id);
assert.equal(packet.mandate.id, mandate.id);
assert.ok(packet.receipts.length >= 4);

console.log("IntentLock policy tests passed.");
