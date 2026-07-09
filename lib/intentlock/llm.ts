import type { CreateMandateInput } from "./types";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const systemPrompt = `You are IntentLock, a policy engine for AI commerce.
Convert user intent into a strict JSON mandate for an agent before money moves.
Return only valid JSON with these fields:
objective, maxBudget, maxPerCall, allowedProviders, blockedActions, requireEscrow, requiredEvidence, acceptanceCriteria, deadline, maxRevisions.
Use conservative payment limits, require evidence, and block unsafe financial actions.`;

function apiKey() {
  return process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
}

function baseUrl() {
  return (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
}

function model() {
  return process.env.LLM_MODEL || "gpt-4o-mini";
}

function trustMode() {
  return process.env.LLM_TRUST_MODE;
}

function extractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

export async function enrichMandateWithLlm(input: CreateMandateInput): Promise<Partial<CreateMandateInput> | null> {
  const key = apiKey();
  if (!key) {
    return null;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: JSON.stringify({
        userIntent: input.userIntent,
        suppliedConstraints: input
      })
    }
  ];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`
  };
  const selectedTrustMode = trustMode();
  if (selectedTrustMode) {
    headers["X-0G-Provider-Trust-Mode"] = selectedTrustMode;
  }

  const response = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model(),
      messages,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`LLM mandate generation failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  const parsed = JSON.parse(extractJson(content)) as Partial<CreateMandateInput>;
  return parsed;
}
