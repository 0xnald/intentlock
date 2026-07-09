export type Currency = "USDt" | "OKB" | "USD";

export type MandateStatus = "active" | "completed" | "revoked";

export type Decision = "approved" | "blocked" | "needs_approval" | "release" | "revise" | "dispute";

export type Mandate = {
  id: string;
  userIntent: string;
  agent: string;
  objective: string;
  currency: Currency;
  maxBudget: number;
  maxPerCall: number;
  allowedProviders: string[];
  blockedActions: string[];
  requireEscrow: boolean;
  requiredEvidence: string[];
  acceptanceCriteria: string[];
  deadline?: string;
  maxRevisions?: number;
  spent: number;
  status: MandateStatus;
  createdAt: string;
  updatedAt: string;
};

export type Receipt = {
  id: string;
  mandateId: string;
  kind: "action" | "payment" | "delivery" | "dispute";
  decision: Decision;
  reason: string;
  amount?: number;
  provider?: string;
  action?: string;
  evidence?: string[];
  createdAt: string;
};

export type CreateMandateInput = {
  userIntent: string;
  agent?: string;
  objective?: string;
  currency?: Currency;
  maxBudget?: number;
  maxPerCall?: number;
  allowedProviders?: string[];
  blockedActions?: string[];
  requireEscrow?: boolean;
  requiredEvidence?: string[];
  acceptanceCriteria?: string[];
  deadline?: string;
  maxRevisions?: number;
};

export type ActionInput = {
  mandateId: string;
  action: string;
  provider?: string;
  amount?: number;
  evidence?: string[];
};

export type PaymentInput = {
  mandateId: string;
  provider: string;
  amount: number;
  purpose: string;
};

export type DeliverableInput = {
  mandateId: string;
  summary: string;
  artifacts: string[];
  evidence: string[];
};

export type DecisionResult = {
  decision: Decision;
  reason: string;
  mandateId: string;
  remainingBudget?: number;
  requiredAction?: string;
  missingCriteria?: string[];
  receipt: Receipt;
};

export type IntentLockStore = {
  mandates: Mandate[];
  receipts: Receipt[];
};
