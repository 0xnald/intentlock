import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import type { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@okxweb3/x402-next";
import { x402ResourceServer } from "@okxweb3/x402-next";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import { NETWORK, PAY_TO, PRICE_AMOUNT, PRICE_USD, SETTLEMENT_ASSET } from "./config";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for paid x402 endpoints.`);
  }
  return value;
}

const facilitatorClient = new OKXFacilitatorClient({
  apiKey: requiredEnv("OKX_FACILITATOR_API_KEY"),
  secretKey: requiredEnv("OKX_FACILITATOR_SECRET_KEY"),
  passphrase: requiredEnv("OKX_FACILITATOR_PASSPHRASE"),
  baseUrl: process.env.OKX_FACILITATOR_BASE_URL ?? "https://www.okx.com"
});

export const x402Server = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme()
);

export const paidToolRoute = {
  accepts: {
    scheme: "exact",
    network: NETWORK,
    payTo: PAY_TO,
    price: {
      amount: PRICE_AMOUNT,
      asset: SETTLEMENT_ASSET
    },
    maxTimeoutSeconds: 300,
    extra: {
      name: "USD₮0",
      version: "1"
    }
  },
  description: "IntentLock paid A2MCP tool call",
  mimeType: "application/json"
} as const;

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export function paidPost(handler: (request: NextRequest) => Promise<NextResponse>) {
  const protectedHandler = withX402(handler, paidToolRoute, x402Server);

  return async (request: NextRequest) => noStore(await protectedHandler(request));
}
