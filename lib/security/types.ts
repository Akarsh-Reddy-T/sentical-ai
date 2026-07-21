export type Severity = "critical" | "high" | "medium" | "low";

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  line: number;
  evidence: string;
  recommendation: string;
  cwe: string;
  standards: string[];
};

export type GuardrailResult = {
  name: string;
  status: "passed" | "failed";
  detail: string;
};

export type ScanResult = {
  id: string;
  createdAt: string;
  score: number;
  verdict: "pass" | "review" | "block";
  findings: Finding[];
  guardrails: GuardrailResult[];
  evaluatedStandards: string[];
  stats: {
    lines: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
};
