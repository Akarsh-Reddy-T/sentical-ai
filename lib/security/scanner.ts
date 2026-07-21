import type { Finding, GuardrailResult, ScanResult, Severity } from "./types";

type Rule = {
  id: string;
  title: string;
  severity: Severity;
  pattern: RegExp;
  recommendation: string;
  cwe: string;
  standards: string[];
};

const RULES: Rule[] = [
  {
    id: "SEC-001",
    title: "Hard-coded credential or token",
    severity: "critical",
    pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'`][^"'`\n]{8,}["'`]/i,
    recommendation: "Move secrets to a managed secret store, rotate exposed values, and inject them at runtime.",
    cwe: "CWE-798",
    standards: ["OWASP A02", "NIST SSDF PW.4", "SOC 2 CC6.1"]
  },
  {
    id: "SEC-002",
    title: "Dynamic code execution",
    severity: "critical",
    pattern: /\b(?:eval|Function)\s*\(/,
    recommendation: "Remove dynamic execution. Parse against a strict allowlist and use typed dispatch instead.",
    cwe: "CWE-95",
    standards: ["OWASP A03", "OWASP ASVS V5"]
  },
  {
    id: "SEC-003",
    title: "Potential command injection",
    severity: "critical",
    pattern: /\b(?:exec|execSync|spawn)\s*\(\s*(?:`|[^,\n]+\+)/,
    recommendation: "Avoid shell execution. Pass validated arguments to a non-shell process API.",
    cwe: "CWE-78",
    standards: ["OWASP A03", "NIST SSDF PW.5"]
  },
  {
    id: "SEC-004",
    title: "Potential SQL injection",
    severity: "high",
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]{0,100}(?:\$\{|\+\s*\w+)/i,
    recommendation: "Use parameterized queries or a query builder; never interpolate untrusted input into SQL.",
    cwe: "CWE-89",
    standards: ["OWASP A03", "OWASP ASVS V5"]
  },
  {
    id: "SEC-005",
    title: "Weak random value used in security-sensitive code",
    severity: "high",
    pattern: /Math\.random\(\)[\s\S]{0,60}(?:token|key|secret|nonce|session)/i,
    recommendation: "Use crypto.randomUUID() or crypto.getRandomValues() for security-sensitive randomness.",
    cwe: "CWE-338",
    standards: ["OWASP A02", "OWASP ASVS V6"]
  },
  {
    id: "SEC-006",
    title: "Unsafe HTML rendering",
    severity: "high",
    pattern: /dangerouslySetInnerHTML|\.innerHTML\s*=/,
    recommendation: "Render text normally or sanitize with a reviewed allowlist-based HTML sanitizer.",
    cwe: "CWE-79",
    standards: ["OWASP A03", "OWASP ASVS V5"]
  },
  {
    id: "SEC-007",
    title: "Sensitive data may be written to logs",
    severity: "medium",
    pattern: /console\.(?:log|info|debug)\s*\([^\n]*(?:password|secret|token|authorization)/i,
    recommendation: "Use structured logging with field-level redaction and never log credentials or authorization headers.",
    cwe: "CWE-532",
    standards: ["OWASP A09", "SOC 2 CC7.2"]
  },
  {
    id: "SEC-008",
    title: "TLS certificate verification disabled",
    severity: "critical",
    pattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0/,
    recommendation: "Restore certificate verification and configure the correct trusted CA bundle.",
    cwe: "CWE-295",
    standards: ["OWASP A02", "NIST SSDF PW.9"]
  },
  {
    id: "SEC-009",
    title: "Unvalidated redirect target",
    severity: "medium",
    pattern: /(?:redirect|location\.href)\s*\([^\n]*(?:req\.|request\.|searchParams|query)/i,
    recommendation: "Allowlist local redirect paths or explicitly approved origins.",
    cwe: "CWE-601",
    standards: ["OWASP A01", "OWASP ASVS V4"]
  }
];

const severityWeight: Record<Severity, number> = {
  critical: 28,
  high: 16,
  medium: 8,
  low: 3
};

function deterministicId(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;

  for (let index = 0; index < value.length; index += 1) {
    const character = value.charCodeAt(index);
    first = Math.imul(first ^ character, 0x01000193);
    second = Math.imul(second ^ character, 0x85ebca6b);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`.slice(0, 12);
}

function safeEvidence(line: string): string {
  const redacted = line.replace(
    /((?:api[_-]?key|secret|password|token)\s*[:=]\s*["'`])([^"'`\n]+)(["'`])/gi,
    "$1[REDACTED]$3"
  );
  return redacted.trim().slice(0, 160);
}

function runRules(code: string): Finding[] {
  const lines = code.split(/\r?\n/);
  const findings: Finding[] = [];

  for (const rule of RULES) {
    lines.forEach((line, index) => {
      if (rule.pattern.test(line)) {
        findings.push({
          id: `${rule.id}-${index + 1}`,
          title: rule.title,
          severity: rule.severity,
          line: index + 1,
          evidence: safeEvidence(line),
          recommendation: rule.recommendation,
          cwe: rule.cwe,
          standards: rule.standards
        });
      }
      rule.pattern.lastIndex = 0;
    });
  }

  return findings.sort(
    (a, b) => severityWeight[b.severity] - severityWeight[a.severity] || a.line - b.line
  );
}

function evaluateGuardrails(code: string): GuardrailResult[] {
  const tests = [
    {
      name: "Secret exposure",
      failed: /(?:sk-[a-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/i.test(code),
      detail: "Detects common private keys and high-confidence credential formats."
    },
    {
      name: "Prompt injection",
      failed: /(?:ignore (?:all|any|the) previous instructions|reveal (?:the )?system prompt|developer message)/i.test(code),
      detail: "Flags instruction-hijacking phrases before content reaches an AI model."
    },
    {
      name: "Personal data",
      failed: /\b\d{3}-\d{2}-\d{4}\b|\b(?:\d[ -]*?){13,16}\b/.test(code),
      detail: "Detects likely U.S. SSNs and payment card-like number patterns."
    },
    {
      name: "Dangerous execution",
      failed: /\b(?:eval|execSync)\s*\(/.test(code),
      detail: "Blocks common dynamic execution paths used in code injection attacks."
    }
  ];

  return tests.map((test) => ({
    name: test.name,
    status: test.failed ? "failed" : "passed",
    detail: test.detail
  }));
}

export function scanCode(code: string): ScanResult {
  const findings = runRules(code);
  const guardrails = evaluateGuardrails(code);
  const penalty = findings.reduce((sum, finding) => sum + severityWeight[finding.severity], 0);
  const guardrailPenalty = guardrails.filter((guardrail) => guardrail.status === "failed").length * 8;
  const score = Math.max(0, 100 - penalty - guardrailPenalty);
  const critical = findings.filter((finding) => finding.severity === "critical").length;
  const high = findings.filter((finding) => finding.severity === "high").length;

  return {
    id: `scan_${deterministicId(code)}`,
    createdAt: new Date().toISOString(),
    score,
    verdict: critical > 0 ? "block" : high > 0 || score < 80 ? "review" : "pass",
    findings,
    guardrails,
    evaluatedStandards: [
      "OWASP Top 10 (2021)",
      "OWASP ASVS 4.0.3",
      "NIST SSDF 1.1",
      "CWE Top 25",
      "SOC 2 Security Criteria"
    ],
    stats: {
      lines: code.split(/\r?\n/).length,
      critical,
      high,
      medium: findings.filter((finding) => finding.severity === "medium").length,
      low: findings.filter((finding) => finding.severity === "low").length
    }
  };
}
