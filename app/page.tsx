import { SecurityDashboard } from "@/app/components/security-dashboard";
import { scanCode } from "@/lib/security/scanner";

const sampleCode = `import { exec } from "node:child_process";

export async function runReport(req) {
  const token = "sk-demo-secret-123456789";
  const user = req.query.user;
  console.log("authorization token", token);
  exec(\`report --user \${user}\`);
  return { ok: true };
}`;

export default function Home() {
  return <SecurityDashboard initialCode={sampleCode} initialResult={scanCode(sampleCode)} />;
}
