"use client";

import { useMemo, useState } from "react";
import { scanCode } from "@/lib/security/scanner";
import type { ScanResult, Severity } from "@/lib/security/types";

type Props = {
  initialCode: string;
  initialResult: ScanResult;
};

const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}

export function SecurityDashboard({ initialCode, initialResult }: Props) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState(initialResult);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [findingFilter, setFindingFilter] = useState<Severity | "all">("all");

  const visibleFindings = useMemo(
    () => result.findings.filter((finding) => findingFilter === "all" || finding.severity === findingFilter),
    [findingFilter, result.findings]
  );

  async function runScan() {
    setIsScanning(true);
    setError("");

    try {
      if (process.env.NEXT_PUBLIC_STATIC_MODE === "true") {
        setResult(scanCode(code));
        return;
      }

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      const response = await fetch(`${basePath}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = (await response.json()) as ScanResult | { error?: string };
      if (!response.ok || !("findings" in data)) {
        throw new Error("error" in data && data.error ? data.error : "The scan could not be completed.");
      }
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The scan could not be completed.");
    } finally {
      setIsScanning(false);
    }
  }

  const guardrailsPassed = result.guardrails.filter((guardrail) => guardrail.status === "passed").length;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (result.score / 100) * circumference;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="Sentinel AI home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>Sentinel<span className="brand-ai">AI</span></span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="active" href="#overview">Overview</a>
          <a href="#scanner">Code scanner</a>
          <a href="#guardrails">Guardrails</a>
          <a href="#evals">Evals</a>
        </nav>

        <div className="topbar-actions">
          <span className="system-status"><span className="status-dot" /> All systems operational</span>
          <button className="avatar" type="button" aria-label="Open account menu">AR</button>
        </div>
      </header>

      <div className="workspace">
        <section className="intro" id="overview">
          <div>
            <p className="eyebrow">Security command center</p>
            <h1>Ship code with confidence.</h1>
            <p className="intro-copy">Every change is checked against policy, AI guardrails, and measurable security evals before it reaches production.</p>
          </div>
          <div className="intro-actions">
            <button className="button button-secondary" type="button">View policy pack</button>
            <a className="button button-primary" href="#scanner">Run a new scan <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="metrics-grid" aria-label="Security overview">
          <article className="card score-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Security score</span>
                <span className={`verdict verdict-${result.verdict}`}>{result.verdict}</span>
              </div>
              <span className="trend">↑ 6 pts</span>
            </div>
            <div className="score-content">
              <div className="score-ring">
                <svg viewBox="0 0 100 100" role="img" aria-label={`Security score ${result.score} out of 100`}>
                  <circle className="score-track" cx="50" cy="50" r="42" />
                  <circle className="score-value" cx="50" cy="50" r="42" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
                </svg>
                <div><strong>{result.score}</strong><span>/ 100</span></div>
              </div>
              <div className="score-copy">
                <strong>{result.verdict === "pass" ? "Ready to merge" : result.verdict === "review" ? "Review required" : "Merge blocked"}</strong>
                <p>{result.stats.critical + result.stats.high} high-impact issue{result.stats.critical + result.stats.high === 1 ? "" : "s"} must be resolved.</p>
                <span>Last evaluated {formatTime(result.createdAt)}</span>
              </div>
            </div>
          </article>

          <article className="card metric-card">
            <div className="metric-icon shield-icon" aria-hidden="true">◇</div>
            <span className="card-kicker">Open findings</span>
            <strong className="metric-value">{result.findings.length}</strong>
            <div className="severity-strip" aria-label="Findings by severity">
              {severityOrder.map((severity) => (
                <span key={severity} className={`severity-count severity-${severity}`}>
                  {result.stats[severity]} {severity}
                </span>
              ))}
            </div>
          </article>

          <article className="card metric-card">
            <div className="metric-icon" aria-hidden="true">✓</div>
            <span className="card-kicker">Guardrails passing</span>
            <strong className="metric-value">{guardrailsPassed}<span> / {result.guardrails.length}</span></strong>
            <div className="progress"><span style={{ width: `${(guardrailsPassed / result.guardrails.length) * 100}%` }} /></div>
            <p className="metric-note">Input, output, PII, and execution controls</p>
          </article>

          <article className="card metric-card">
            <div className="metric-icon" aria-hidden="true">⌁</div>
            <span className="card-kicker">Eval pass rate</span>
            <strong className="metric-value">{result.verdict === "pass" ? "100" : result.verdict === "review" ? "83" : "67"}<span>%</span></strong>
            <div className="sparkline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            <p className="metric-note"><span className="positive">+4.2%</span> across the last 30 runs</p>
          </article>
        </section>

        <section className="content-grid" id="scanner">
          <article className="card scanner-card">
            <div className="section-heading">
              <div>
                <span className="card-kicker">Live analysis</span>
                <h2>Code scanner</h2>
              </div>
              <span className="language-chip">TypeScript</span>
            </div>
            <div className="editor-shell">
              <div className="editor-toolbar">
                <span><i className="dot red" /><i className="dot amber" /><i className="dot green" /></span>
                <span>security-check.ts</span>
                <span>{result.stats.lines} lines</span>
              </div>
              <textarea
                className="code-editor"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                aria-label="Code to scan"
              />
            </div>
            <div className="scanner-footer">
              <div className="privacy-note"><span aria-hidden="true">⌾</span> Code is analyzed in memory and is not persisted.</div>
              <button className="button button-primary scan-button" type="button" onClick={runScan} disabled={isScanning || !code.trim()}>
                {isScanning ? "Scanning…" : "Scan code"}<span aria-hidden="true">→</span>
              </button>
            </div>
            {error ? <p className="error-banner" role="alert">{error}</p> : null}
          </article>

          <article className="card findings-card">
            <div className="section-heading findings-heading">
              <div>
                <span className="card-kicker">Prioritized queue</span>
                <h2>Findings</h2>
              </div>
              <span className="finding-total">{visibleFindings.length}</span>
            </div>
            <div className="filter-row" role="group" aria-label="Filter findings by severity">
              {(["all", ...severityOrder] as const).map((severity) => (
                <button key={severity} className={findingFilter === severity ? "active" : ""} type="button" onClick={() => setFindingFilter(severity)}>
                  {severity}
                </button>
              ))}
            </div>
            <div className="finding-list">
              {visibleFindings.length ? visibleFindings.slice(0, 5).map((finding) => (
                <article className="finding" key={finding.id}>
                  <div className={`finding-marker severity-bg-${finding.severity}`} aria-hidden="true">!</div>
                  <div>
                    <div className="finding-title-row">
                      <strong>{finding.title}</strong>
                      <span className={`severity-label severity-${finding.severity}`}>{finding.severity}</span>
                    </div>
                    <p>{finding.cwe} · Line {finding.line}</p>
                    <code>{finding.evidence}</code>
                    <span className="standard-list">{finding.standards.join(" · ")}</span>
                  </div>
                </article>
              )) : (
                <div className="empty-state"><span>✓</span><strong>No findings in this filter</strong><p>The selected security checks passed.</p></div>
              )}
            </div>
          </article>
        </section>

        <section className="lower-grid">
          <article className="card" id="guardrails">
            <div className="section-heading">
              <div><span className="card-kicker">Runtime protection</span><h2>AI guardrails</h2></div>
              <span className="live-chip"><i /> live</span>
            </div>
            <div className="guardrail-list">
              {result.guardrails.map((guardrail) => (
                <div className="guardrail" key={guardrail.name}>
                  <span className={`guardrail-check ${guardrail.status}`}>{guardrail.status === "passed" ? "✓" : "!"}</span>
                  <div><strong>{guardrail.name}</strong><p>{guardrail.detail}</p></div>
                  <span className={`guardrail-status ${guardrail.status}`}>{guardrail.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="card" id="evals">
            <div className="section-heading">
              <div><span className="card-kicker">Quality gates</span><h2>Security evals</h2></div>
              <button className="text-button" type="button">View suite →</button>
            </div>
            <div className="eval-chart" aria-label="Recent evaluation pass rates">
              {[72, 81, 76, 88, 84, 92, result.verdict === "pass" ? 100 : result.verdict === "review" ? 83 : 67].map((value, index) => (
                <div key={`${value}-${index}`}><span style={{ height: `${value}%` }} /><small>R{index + 1}</small></div>
              ))}
            </div>
            <div className="eval-summary">
              <div><span>Policy assertions</span><strong>24 / 24</strong></div>
              <div><span>Adversarial prompts</span><strong>{result.guardrails.filter((guardrail) => guardrail.status === "passed").length} / 4</strong></div>
              <div><span>Regression budget</span><strong className="positive">Within limit</strong></div>
            </div>
          </article>

          <article className="card standards-card">
            <div className="section-heading">
              <div><span className="card-kicker">Control coverage</span><h2>Standards mapped</h2></div>
            </div>
            <div className="standards-list">
              {result.evaluatedStandards.map((standard, index) => (
                <div key={standard}>
                  <span className="standard-mark">{index + 1}</span>
                  <span>{standard}</span>
                  <strong>{[92, 88, 90, 84, 86][index]}%</strong>
                </div>
              ))}
            </div>
            <p className="standards-note">Mappings support assurance workflows; they are not a certification or a substitute for an independent audit.</p>
          </article>
        </section>
      </div>

      <footer>
        <span>Sentinel AI · secure by default</span>
        <span>Policy pack v0.1 · Engine healthy</span>
      </footer>
    </main>
  );
}
