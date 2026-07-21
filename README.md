# Sentinel AI Security

Sentinel AI is a secure-by-default Next.js and TypeScript starter for checking code changes before they reach production. It combines deterministic source checks, AI-focused input guardrails, security evals, standards mappings, and a working dashboard.

## What is included

- A responsive command-center UI with an interactive code scanner
- A server-side scanning API with strict JSON validation, body limits, and no-store responses
- Secret, injection, unsafe execution, insecure TLS, XSS, redirect, randomness, and sensitive-log checks
- Prompt-injection and personal-data guardrails
- Deterministic eval scoring and merge verdicts
- Control mappings for OWASP Top 10, OWASP ASVS, NIST SSDF, CWE, and SOC 2
- Security headers, a non-root production container, and a health endpoint
- GitHub Actions for tests, locked dependency installation, npm signature verification, advisory auditing, CodeQL, dependency review, SBOM generation, provenance, and container publication

The mappings help organize assurance work. They are not a claim of certification and do not mean every control in every security standard has been implemented.

## Run locally

Requirements: Node.js 22.14 or newer and npm 11.

```bash
npm ci --ignore-scripts
npm run dev
```

Open `http://localhost:3000`.

## Verify the project

```bash
npm run verify
npm run security:audit
npm run security:signatures
```

Lifecycle scripts are disabled in `.npmrc`. Dependencies are pinned exactly and installed from `package-lock.json` with integrity hashes. Review any lockfile change as security-sensitive.

## API

`POST /api/scan` accepts JSON:

```json
{
  "code": "const value = process.env.SECRET;"
}
```

The endpoint accepts at most 200 KB per request and scans at most 150,000 code characters. Source is processed in memory and is not persisted by this starter.

## GitHub Actions deployment

On every push to `main`, the deployment workflow builds a multi-stage, non-root container and publishes two images:

- `ghcr.io/OWNER/REPOSITORY:latest`
- `ghcr.io/OWNER/REPOSITORY:sha-COMMIT_SHA`

GitHub's production environment can be configured with required reviewers. Add a final environment-specific deployment step after the image publish if the runtime will be Kubernetes, AWS, Azure, Google Cloud, or another container host. Keep cloud authentication OIDC-based; do not add long-lived cloud keys to repository secrets.

The `pages.yml` workflow also publishes a browser-only demonstration to GitHub Pages. That static demo runs the deterministic scanner locally in the visitor's browser and does not upload the pasted source. The container deployment keeps the validated `/api/scan` server endpoint for production integrations.

## Production hardening still required

- Put the service behind an API gateway or WAF with distributed rate limits and request logging redaction.
- Add authentication and role-based authorization before storing projects or scans.
- Use managed secrets and key rotation; never commit credentials.
- Add repository rules that require Security CI, CodeQL, dependency review, signed commits, and at least one approving review.
- Add an enterprise SAST engine, DAST, container scanning, threat modeling, and periodic penetration tests.
- Configure retention, data residency, incident response, and audit evidence for the standards your organization actually claims.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting and project security boundaries.
