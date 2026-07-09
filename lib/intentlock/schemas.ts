import { z } from "zod";

export const createMandateSchema = z.object({
  userIntent: z.string().min(8),
  agent: z.string().optional(),
  objective: z.string().optional(),
  currency: z.enum(["USDt", "OKB", "USD"]).optional(),
  maxBudget: z.number().positive().optional(),
  maxPerCall: z.number().positive().optional(),
  allowedProviders: z.array(z.string()).optional(),
  blockedActions: z.array(z.string()).optional(),
  requireEscrow: z.boolean().optional(),
  requiredEvidence: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  deadline: z.string().optional(),
  maxRevisions: z.number().int().nonnegative().optional()
});

export const actionSchema = z.object({
  mandateId: z.string().min(1),
  action: z.string().min(2),
  provider: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  evidence: z.array(z.string()).optional()
});

export const paymentSchema = z.object({
  mandateId: z.string().min(1),
  provider: z.string().min(1),
  amount: z.number().positive(),
  purpose: z.string().min(2)
});

export const deliverableSchema = z.object({
  mandateId: z.string().min(1),
  summary: z.string().min(2),
  artifacts: z.array(z.string()),
  evidence: z.array(z.string())
});

export const disputeSchema = z.object({
  mandateId: z.string().min(1)
});
