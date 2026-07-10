import { LiveProof } from "./live-proof";

const approvedJson = `{
  "decision": "approved",
  "reason": "Provider is allowlisted, request is within max-per-call, and budget remains.",
  "remainingBudget": "29.70 USDt",
  "receiptRequired": true
}`;

const blockedJson = `{
  "decision": "blocked",
  "reason": "Payment exceeds max-per-call and provider is not allowed by the mandate.",
  "requiredAction": "request_user_approval"
}`;

export default function Home() {
  return (
    <main className="page">
      <div className="shell">
        <nav className="nav" aria-label="Main navigation">
          <a className="brand" href="/">
            <span className="brand-mark">
              <img src="/intentlock-logo.png" alt="" />
            </span>
            IntentLock
          </a>
          <div className="nav-links">
            <a href="#mcp">A2MCP</a>
            <a href="#features">Guardrails</a>
            <a href="#api">Tools</a>
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="eyebrow">AI Commerce Guardrails</div>
            <h1>Give your AI freedom without unlimited authority.</h1>
            <p className="lead">
              IntentLock turns vague user intent into enforceable agent mandates before money moves.
              Agents ask IntentLock for permission before they spend, hire providers, call paid MCPs,
              or release escrow.
            </p>
            <div className="actions">
              <a className="button" href="/api/manifest">
                View ASP manifest
              </a>
              <a className="button secondary" href="#api">
                Inspect tools
              </a>
              <a className="button secondary" href="#proof">
                Run live proof
              </a>
            </div>
          </div>

          <div className="hero-panel" aria-label="IntentLock decision examples">
            <div className="terminal-head">
              <span>IntentLock / payment gate</span>
              <span>X Layer · eip155:196</span>
            </div>
            <div className="decision">
              <strong>Approved</strong>
              <pre className="code">{approvedJson}</pre>
            </div>
            <div className="decision blocked">
              <strong>Blocked</strong>
              <pre className="code">{blockedJson}</pre>
            </div>
          </div>
        </section>
      </div>

      <section className="band" id="features">
        <div className="shell">
          <div className="section-head">
            <h2>The trust layer for AI commerce.</h2>
            <p>
              Every commercial agent workflow needs a permission layer. IntentLock defines what
              the agent can spend, who it can pay, what evidence it must collect, and when delivery
              is good enough for settlement.
            </p>
          </div>
          <div className="grid">
            <article className="feature">
              <span>01</span>
              <h3>Budget authority</h3>
              <p>Daily budgets, max-per-call rules, provider allowlists, and blocked actions.</p>
            </article>
            <article className="feature">
              <span>02</span>
              <h3>Acceptance criteria</h3>
              <p>Clear delivery requirements before another ASP is hired or escrow is released.</p>
            </article>
            <article className="feature">
              <span>03</span>
              <h3>Evidence trail</h3>
              <p>Receipts, action logs, provider responses, and dispute packets for review.</p>
            </article>
          </div>
        </div>
      </section>

      <LiveProof />

      <section className="band" id="api">
        <div className="shell tool-grid">
          <div className="tool-panel">
            <h3>A2MCP tools</h3>
            <ul className="api-list">
              <li><code>create_mandate</code><span>Define rules before work starts</span></li>
              <li><code>validate_agent_action</code><span>Approve or block planned actions</span></li>
              <li><code>check_payment_request</code><span>Evaluate paid MCP or ASP calls</span></li>
              <li><code>score_deliverable</code><span>Check delivery against criteria</span></li>
              <li><code>generate_dispute_packet</code><span>Package receipts and evidence</span></li>
            </ul>
          </div>
          <div className="tool-panel" id="mcp">
            <h3>Registration data</h3>
            <ul className="api-list">
              <li><code>Name</code><span>IntentLock</span></li>
              <li><code>Network</code><span>X Layer mainnet</span></li>
              <li><code>Price</code><span>$0.01 per paid call</span></li>
              <li><code>Pay to</code><span>0xec78...847D</span></li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="shell footer">
        <span>IntentLock: enforceable intent for OKX.AI agent commerce.</span>
        <span>Best Product · Business Potential · Finance Copilot</span>
      </footer>
    </main>
  );
}
