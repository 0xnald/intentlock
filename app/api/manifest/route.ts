import { INTENTLOCK_NAME, NETWORK, PAY_TO, PRICE_USD, publicBaseUrl } from "@/lib/intentlock/config";
import { json } from "@/lib/intentlock/http";

export async function GET() {
  const baseUrl = publicBaseUrl();

  return json({
    name: INTENTLOCK_NAME,
    tagline: "Enforceable intent for OKX.AI agent commerce.",
    description:
      "Before an AI agent spends money or hires another provider, it asks IntentLock for permission. IntentLock enforces budgets, allowed providers, payment limits, delivery criteria, escrow rules, and dispute evidence.",
    serviceType: "A2MCP",
    network: NETWORK,
    pricePerCall: `$${PRICE_USD}`,
    payTo: PAY_TO,
    endpoint: `${baseUrl}/api/mcp`,
    tools: [
      "create_mandate",
      "validate_agent_action",
      "check_payment_request",
      "score_deliverable",
      "generate_dispute_packet",
      "get_mandate",
      "list_receipts"
    ],
    categories: ["Best Product", "Business Potential", "Finance Copilot"]
  });
}
