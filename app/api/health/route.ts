import { NETWORK, PAY_TO, PRICE_USD } from "@/lib/intentlock/config";
import { json } from "@/lib/intentlock/http";

export async function GET() {
  return json({
    ok: true,
    service: "IntentLock",
    network: NETWORK,
    payTo: PAY_TO,
    pricePerCall: `$${PRICE_USD}`
  });
}
