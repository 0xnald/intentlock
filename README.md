# IntentLock

IntentLock is an A2MCP-first ASP for OKX.AI agent commerce. Before an AI agent spends money, hires another ASP, calls a paid MCP, or releases escrow, it asks IntentLock for permission.

## Environment

Set these locally in `.env.local` and in Vercel project environment variables:

```env
INTENTLOCK_BASE_URL=https://your-vercel-domain.vercel.app
INTENTLOCK_PAY_TO=0xec78b1F51adf01bE5D94973c203a40cb4A5f847D
INTENTLOCK_PRICE_USD=0.01
INTENTLOCK_NETWORK=eip155:196
INTENTLOCK_SETTLEMENT_ASSET=0x779ded0c9e1022225f8e0630b35a9b54be713736

OKX_FACILITATOR_API_KEY=
OKX_FACILITATOR_SECRET_KEY=
OKX_FACILITATOR_PASSPHRASE=
OKX_FACILITATOR_BASE_URL=https://www.okx.com

LLM_API_KEY=
LLM_BASE_URL=https://router-api.0g.ai/v1
LLM_MODEL=qwen3.7-max
LLM_TRUST_MODE=verified
```

`OPENAI_API_KEY` is also supported as a fallback for `LLM_API_KEY`.

For 0G, `https://pc.0g.ai/` is the portal/dashboard. The OpenAI-compatible
router API base is `https://router-api.0g.ai/v1`.

## Vercel

Use the default Next.js build settings:

```text
Build command: pnpm build
Output: .next
Install command: pnpm install
```

The ASP endpoint for OKX.AI registration is:

```text
https://your-vercel-domain.vercel.app/api/mcp
```

The registration manifest is:

```text
https://your-vercel-domain.vercel.app/api/manifest
```
