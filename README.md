# IntentLock

IntentLock is a real OKX.AI Agent Service Provider (ASP) that gives autonomous agents enforceable guardrails before they spend money, hire providers, call paid services, release escrow, or accept deliverables.

In one sentence:

```text
IntentLock turns vague user intent into enforceable agent mandates before money moves.
```

IntentLock is built as a paid A2MCP service for OKX.AI agent commerce. An agent calls IntentLock, IntentLock checks the user's mandate, and the service returns whether the requested action should be approved, blocked, sent for user approval, revised, released, or escalated as a dispute.

## Live Status

```text
ASP name: IntentLock
OKX.AI Agent ID: #4944
Role: ASP
Marketplace status: submitted for review
Service name: Intent Guardrail API
Service type: A2MCP / API service
Fee: 0.01 USDT per call
Network: X Layer mainnet
Network ID: eip155:196
Receiving wallet: 0xec78b1F51adf01bE5D94973c203a40cb4A5f847D
Registration transaction: 0x22b5610199f8fd988c14f63145c78c8bda18af47a1c922af44040c66dcc9f596
```

Live deployment:

```text
App: https://intentlock.vercel.app
Health: https://intentlock.vercel.app/api/health
Manifest: https://intentlock.vercel.app/api/manifest
A2MCP endpoint: https://intentlock.vercel.app/api/mcp
```

## Why IntentLock Exists

AI agents are becoming able to:

- spend funds
- call paid APIs
- hire other agents or ASPs
- negotiate work
- release escrow
- review deliverables
- trigger multi-step workflows

That creates a trust problem. A user may give an agent a simple instruction like:

```text
Find a logo designer and pay for the best option under $30.
```

Without guardrails, the agent could contact too many providers, overspend, pay an untrusted provider, accept poor work, lose evidence, or create a dispute with no audit trail.

IntentLock solves that by creating and enforcing a machine-readable mandate:

```json
{
  "agent": "DesignBuyer",
  "objective": "Hire a logo designer under budget",
  "currency": "USDt",
  "maxBudget": 30,
  "maxPerCall": 1,
  "allowedProviders": ["TopRatedDesignASP"],
  "blockedActions": ["unverified contract", "withdraw", "private key"],
  "requireEscrow": true,
  "requiredEvidence": ["receipts", "conversation logs", "delivery screenshots"],
  "acceptanceCriteria": ["PNG", "SVG", "source files"],
  "maxRevisions": 2
}
```

Then every sensitive action becomes a policy check:

```text
Agent wants to spend money -> ask IntentLock first.
Agent wants to hire a provider -> ask IntentLock first.
Agent wants to release escrow -> ask IntentLock first.
Agent wants to accept a deliverable -> ask IntentLock first.
```

## Product Flow

1. A user gives an AI agent a task.
2. The agent creates or retrieves an IntentLock mandate.
3. Before taking a sensitive action, the agent calls IntentLock.
4. IntentLock checks budget, provider allowlists, blocked actions, evidence, and acceptance criteria.
5. IntentLock returns a structured decision.
6. IntentLock records a receipt for auditability and disputes.

Example decision:

```json
{
  "decision": "approved",
  "reason": "Payment request satisfies the mandate.",
  "mandateId": "mandate_abc123",
  "remainingBudget": 29,
  "receipt": {
    "kind": "payment",
    "decision": "approved",
    "amount": 1,
    "provider": "TopRatedDesignASP"
  }
}
```

Example block:

```json
{
  "decision": "blocked",
  "reason": "Provider UnknownProvider is not allowlisted.",
  "mandateId": "mandate_abc123",
  "remainingBudget": 30
}
```

## OKX.AI Alignment

IntentLock is designed specifically for the OKX.AI ASP model:

- A2MCP services are standardized, callable API services.
- Paid A2MCP endpoints use x402 payment requirements.
- OKX.AI agent commerce needs payment, escrow, delivery, review, and dispute flows.
- IntentLock sits before payment or delivery acceptance and enforces the user's intent.

The registered OKX.AI service is:

```text
Service name: Intent Guardrail API
Type: API service
Fee: 0.01 USDT
Endpoint: https://intentlock.vercel.app/api/mcp
Description:
Enforces user mandates before an agent spends money, hires providers, calls paid services, releases escrow, or evaluates deliverables.

User must provide the mandate details, proposed action or payment request, relevant receipts, deliverables, and dispute evidence.
```

## A2MCP Tools

IntentLock exposes seven tools through the paid JSON-RPC MCP endpoint.

### `create_mandate`

Creates an enforceable mandate before an AI agent spends money, hires a provider, or starts paid work.

Required:

```json
{
  "userIntent": "Find a designer and stay under $30."
}
```

Optional fields:

```json
{
  "agent": "DesignBuyer",
  "objective": "Hire a logo designer",
  "currency": "USDt",
  "maxBudget": 30,
  "maxPerCall": 1,
  "allowedProviders": ["TopRatedDesignASP"],
  "blockedActions": ["unverified contract", "withdraw"],
  "requireEscrow": true,
  "requiredEvidence": ["receipts", "conversation logs"],
  "acceptanceCriteria": ["PNG", "SVG", "source files"],
  "deadline": "2026-07-17T00:00:00Z",
  "maxRevisions": 2
}
```

If an LLM API key is configured, IntentLock can enrich the mandate from the natural-language user intent. Explicit fields supplied by the caller still take priority.

### `validate_agent_action`

Checks whether a planned action is allowed under an existing mandate.

```json
{
  "mandateId": "mandate_abc123",
  "action": "Call TopRatedDesignASP for a quote",
  "provider": "TopRatedDesignASP",
  "amount": 0.25,
  "evidence": ["quote request"]
}
```

Possible decisions:

```text
approved
blocked
needs_approval
```

### `check_payment_request`

Approves, blocks, or requires user approval for an agent payment request.

```json
{
  "mandateId": "mandate_abc123",
  "provider": "TopRatedDesignASP",
  "amount": 1,
  "purpose": "Pay for design shortlist"
}
```

IntentLock checks:

- mandate status
- provider allowlist
- max-per-call limit
- remaining budget

Approved payments update the mandate's spent amount and create a receipt.

### `score_deliverable`

Evaluates whether a provider's deliverable satisfies the mandate's acceptance criteria and evidence requirements.

```json
{
  "mandateId": "mandate_abc123",
  "summary": "Final logo delivered with PNG, SVG, and source files.",
  "artifacts": ["logo.png", "logo.svg", "source.fig"],
  "evidence": ["receipts", "conversation logs", "delivery screenshots"]
}
```

Possible decisions:

```text
release
revise
dispute
```

### `generate_dispute_packet`

Collects the mandate, receipts, and evidence into a structured dispute packet.

```json
{
  "mandateId": "mandate_abc123"
}
```

The packet includes:

- mandate details
- all matching receipts
- collected evidence
- generated timestamp
- recommended action

### `get_mandate`

Retrieves an existing mandate by ID.

```json
{
  "mandateId": "mandate_abc123"
}
```

### `list_receipts`

Lists IntentLock receipts. It can list all receipts or only receipts for one mandate.

```json
{
  "mandateId": "mandate_abc123"
}
```

## Endpoint Behavior

### `GET /api/health`

Public health check for deployment and registration validation.

Live:

```text
https://intentlock.vercel.app/api/health
```

Returns service name, network, receiving wallet, and displayed price.

### `GET /api/manifest`

Public registration metadata for humans, reviewers, and marketplace checks.

Live:

```text
https://intentlock.vercel.app/api/manifest
```

Includes name, tagline, description, service type, network, price, payment address, MCP endpoint, LLM status, tools, and target categories.

### `GET /api/mcp`

Public metadata for the MCP endpoint. This exists so reviewers can open the endpoint in a browser and understand how to call it.

Live:

```text
https://intentlock.vercel.app/api/mcp
```

Returns:

- transport type
- supported JSON-RPC methods
- payment protocol
- tool names and descriptions

### `POST /api/mcp`

The real paid A2MCP endpoint. It supports JSON-RPC methods:

```text
initialize
tools/list
tools/call
```

Unauthenticated/unpaid requests return `402 Payment Required` with an x402 `Payment-Required` header.

Verified live behavior:

```text
POST https://intentlock.vercel.app/api/mcp
Status: 402 Payment Required
Payment protocol: x402
Network: eip155:196
Amount: 10000
Asset: 0x779ded0c9e1022225f8e0630b35a9b54be713736
Pay to: 0xec78b1F51adf01bE5D94973c203a40cb4A5f847D
```

## JSON-RPC Examples

### List Tools

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Because the endpoint is paid, this request must include a valid x402 payment flow. Without payment, it correctly returns `402 Payment Required`.

### Call `create_mandate`

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_mandate",
    "arguments": {
      "userIntent": "Hire a designer for a logo under 30 USDt.",
      "agent": "DesignBuyer",
      "currency": "USDt",
      "maxBudget": 30,
      "maxPerCall": 1,
      "allowedProviders": ["TopRatedDesignASP"],
      "requireEscrow": true,
      "acceptanceCriteria": ["PNG", "SVG", "source files"],
      "requiredEvidence": ["receipts", "conversation logs"]
    }
  }
}
```

### Call `check_payment_request`

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "check_payment_request",
    "arguments": {
      "mandateId": "mandate_abc123",
      "provider": "TopRatedDesignASP",
      "amount": 1,
      "purpose": "Pay for logo shortlist"
    }
  }
}
```

## Architecture

```text
User intent
   |
   v
AI agent on OKX.AI
   |
   v
IntentLock A2MCP endpoint
   |
   +--> x402 payment requirement
   |
   +--> mandate policy engine
   |
   +--> receipts and audit trail
   |
   v
Decision: approved / blocked / needs_approval / release / revise / dispute
```

Key modules:

```text
app/page.tsx                         Product landing page
app/api/health/route.ts              Health endpoint
app/api/manifest/route.ts            ASP metadata endpoint
app/api/mcp/route.ts                 Paid JSON-RPC A2MCP endpoint
app/api/intentlock/*                 Direct REST routes for each policy capability
lib/intentlock/config.ts             Network, asset, price, and wallet config
lib/intentlock/payment.ts            OKX x402 wrapper
lib/intentlock/policy.ts             Mandate and policy decision logic
lib/intentlock/schemas.ts            Zod validation schemas
lib/intentlock/store.ts              Mandate and receipt persistence
lib/intentlock/llm.ts                Optional LLM mandate enrichment
tests/policy.test.ts                 Policy decision tests
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Run type checks:

```bash
pnpm typecheck
```

Run policy tests:

```bash
pnpm test:policy
```

Build for production:

```bash
pnpm build
```

## Environment Variables

Set these locally in `.env.local` and in Vercel project environment variables.

```env
INTENTLOCK_BASE_URL=https://intentlock.vercel.app
INTENTLOCK_PAY_TO=0xec78b1F51adf01bE5D94973c203a40cb4A5f847D
INTENTLOCK_PRICE_USD=0.01
INTENTLOCK_PRICE_AMOUNT=10000
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

Notes:

- `OPENAI_API_KEY` is also supported as a fallback for `LLM_API_KEY`.
- `https://pc.0g.ai/` is the 0G portal/dashboard.
- `https://router-api.0g.ai/v1` is the OpenAI-compatible 0G router API base used by the app.
- `INTENTLOCK_PRICE_AMOUNT=10000` is the atomic x402 settlement amount used for the configured settlement asset.

## Vercel Deployment

Use the default Next.js build settings:

```text
Install command: pnpm install
Build command: pnpm build
Output directory: .next
```

Required production environment variables:

```text
INTENTLOCK_BASE_URL
INTENTLOCK_PAY_TO
INTENTLOCK_PRICE_USD
INTENTLOCK_PRICE_AMOUNT
INTENTLOCK_NETWORK
INTENTLOCK_SETTLEMENT_ASSET
OKX_FACILITATOR_API_KEY
OKX_FACILITATOR_SECRET_KEY
OKX_FACILITATOR_PASSPHRASE
OKX_FACILITATOR_BASE_URL
LLM_API_KEY
LLM_BASE_URL
LLM_MODEL
LLM_TRUST_MODE
```

After deployment, verify:

```text
https://intentlock.vercel.app/api/health
https://intentlock.vercel.app/api/manifest
https://intentlock.vercel.app/api/mcp
```

Then verify that a `POST` request to `/api/mcp` returns `402 Payment Required` when no payment is attached.

## Direct REST Routes

The MCP endpoint is the primary OKX.AI interface. The app also exposes direct REST routes for development and debugging:

```text
POST /api/intentlock/create-mandate
POST /api/intentlock/validate-agent-action
POST /api/intentlock/check-payment-request
POST /api/intentlock/score-deliverable
POST /api/intentlock/generate-dispute-packet
GET  /api/intentlock/get-mandate?mandateId=...
GET  /api/intentlock/list-receipts
GET  /api/intentlock/list-receipts?mandateId=...
```

These routes use the same policy engine as the MCP tools. The OKX.AI registered endpoint remains:

```text
https://intentlock.vercel.app/api/mcp
```

## Data Storage

The current implementation stores mandates and receipts in a local JSON file:

```text
intentlock-data.json
```

That file is ignored by git. For production scale, the storage layer can be moved to a database such as Postgres, Supabase, Neon, or Vercel KV without changing the public MCP tool contract.

## LLM Mandate Enrichment

IntentLock can optionally use an OpenAI-compatible LLM endpoint to enrich a user's vague request into structured mandate fields.

Configured provider:

```text
0G router API
Base URL: https://router-api.0g.ai/v1
Model: qwen3.7-max
Trust mode: verified
```

The policy engine does not depend on the LLM for enforcement. If LLM enrichment is unavailable, IntentLock still creates and enforces mandates using deterministic defaults and caller-supplied fields.

## Hackathon Positioning

IntentLock targets:

```text
Best Product
Business Potential
Finance Copilot
```

Why it fits:

- It is a real paid ASP, not a static demo.
- It uses a live x402-compatible paid endpoint.
- It supports recurring usage because every sensitive agent action can require a guardrail check.
- It increases trust in OKX.AI agent commerce by making autonomous spending safer.
- It creates direct payment activity on X Layer.
- It provides audit trails for disputes and payment review.

## Suggested One-Liner

```text
IntentLock is the trust layer for AI commerce: before an agent spends, hires, pays, or releases escrow, it checks the user's enforceable mandate.
```

## Suggested Demo Story

```text
I ask an AI agent to hire a designer with a 30 USDt budget.

Without IntentLock, the agent could overspend, use unknown providers, accept poor deliverables, or lose dispute evidence.

With IntentLock, the agent first creates a mandate. Every payment, provider choice, and deliverable review is checked against the user's budget, allowlist, escrow rules, evidence requirements, and acceptance criteria.

IntentLock approves safe actions, blocks unsafe ones, and creates receipts for audits or disputes.
```

## Repository

```text
https://github.com/0xnald/intentlock
```
