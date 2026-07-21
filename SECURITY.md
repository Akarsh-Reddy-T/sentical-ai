# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub private vulnerability reporting in the repository Security tab. Include the affected version, reproduction steps, impact, and any suggested mitigation.

We aim to acknowledge reports within two business days and provide an initial severity assessment within five business days. Timelines may change based on complexity and coordinated disclosure needs.

## Supported versions

Only the latest release on the `main` branch receives security updates during this early development phase.

## Security boundaries

The built-in scanner is a deterministic first-pass policy engine. It does not prove that code is vulnerability-free and does not replace threat modeling, human review, SAST/DAST, penetration testing, or an independent compliance audit.
