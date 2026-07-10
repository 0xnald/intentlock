"use client";

import { useEffect, useState } from "react";

type ProofResult = {
  mandate?: {
    id: string;
    objective: string;
    maxBudget: number;
    maxPerCall: number;
    allowedProviders: string[];
    blockedActions: string[];
  };
  checks?: {
    approvedPayment?: {
      decision: string;
      reason: string;
      remainingBudget: number;
    };
    blockedAction?: {
      decision: string;
      reason: string;
      requiredAction?: string;
    };
    deliverableReview?: {
      decision: string;
      reason: string;
    };
  };
  receipts?: unknown[];
};

export function LiveProof() {
  const [result, setResult] = useState<ProofResult | null>(null);
  const [raw, setRaw] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const startedAt = Date.now();
    setElapsedSeconds(0);
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  async function runProof() {
    setIsRunning(true);
    setError("");
    setRaw("");
    setResult(null);

    try {
      const response = await fetch("/api/demo/intentlock", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Live proof failed.");
      }

      setResult(body);
      setRaw(JSON.stringify(body, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Live proof failed.");
    } finally {
      setIsRunning(false);
    }
  }

  const approved = result?.checks?.approvedPayment;
  const blocked = result?.checks?.blockedAction;
  const reviewed = result?.checks?.deliverableReview;

  return (
    <section className="band live-proof" id="proof">
      <div className="shell proof-layout">
        <div>
          <div className="eyebrow">Live Policy Proof</div>
          <h2>Watch IntentLock make real decisions.</h2>
          <p>
            This button calls a live API route that uses the same mandate engine behind the
            A2MCP tools. It creates a mandate, approves an allowed payment, blocks an unsafe
            action, scores a deliverable, and returns receipts.
          </p>
          <button className="button proof-button" type="button" onClick={runProof} disabled={isRunning}>
            {isRunning ? "Running..." : "Run live proof"}
          </button>
          {isRunning ? (
            <p className="proof-status">
              Calling the configured LLM, generating a mandate, then running policy checks.
              Elapsed: {elapsedSeconds}s.
            </p>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <div className="proof-panel">
          <div className="terminal-head">
            <span>IntentLock / live engine</span>
            <span>{result?.mandate?.id ?? "Ready"}</span>
          </div>

          <div className="proof-steps">
            <div className="proof-step">
              <span>Mandate</span>
              <strong>{result?.mandate?.objective ?? "Waiting for proof run"}</strong>
              <small>
                Budget {result?.mandate ? `${result.mandate.maxBudget} USDt` : "--"} | Max per call{" "}
                {result?.mandate ? `${result.mandate.maxPerCall} USDt` : "--"}
              </small>
            </div>

            <div className="proof-step success">
              <span>Safe payment</span>
              <strong>{approved?.decision ?? "Pending"}</strong>
              <small>{approved?.reason ?? "Approved result appears here."}</small>
            </div>

            <div className="proof-step danger">
              <span>Unsafe action</span>
              <strong>{blocked?.decision ?? "Pending"}</strong>
              <small>{blocked?.reason ?? "Blocked result appears here."}</small>
            </div>

            <div className="proof-step">
              <span>Deliverable</span>
              <strong>{reviewed?.decision ?? "Pending"}</strong>
              <small>{reviewed?.reason ?? "Delivery review appears here."}</small>
            </div>
          </div>

          {raw ? <pre className="code proof-raw">{raw}</pre> : null}
        </div>
      </div>
    </section>
  );
}
