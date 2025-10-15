# Security Guidelines for `paws-management`

This document provides actionable security controls and best practices tailored to the **paws-management** codebase, ensuring a robust, resilient, and maintainable application by design.

---

## 1. Security by Design

- **Integrate early & often**: Treat security as a core feature from initial planning through deployment. Embed security reviews into every sprint or release cycle.
- **Threat modeling**: Identify assets (user credentials, PII, sessions) and potential threats (injection, broken auth, misconfiguration) before implementation.
- **Security checkpoints**: Require peer code reviews for all authentication, database, and API changes.

---

## 2. Authentication & Access Control

### 2.1 Harden Better Auth Configuration

- Enforce strong password policies: e.g., minimum 12 characters, mixed case, numbers, symbols. Reject weak or common passwords.
- Use Argon2 or bcrypt (with unique salts) for password hashing.
- Ensure `Better Auth` is configured to reject “none” JWT algorithms and validate token signatures & expiry (`exp`).

### 2.2 Secure Session Management

- Set session cookies with `HttpOnly`, `Secure`, `SameSite=strict` attributes.
- Define idle and absolute session timeouts; automatically revoke expired sessions in the database.
- Implement logout endpoints that destroy sessions both client- and server-side.
- Protect against session fixation by regenerating session identifiers on privilege elevation (e.g., after login).

### 2.3 Role-Based Access Control (RBAC)

- Define clear roles (e.g., `admin`, `user`) and map permissions (read, write, delete).
- Enforce server-side authorization in every API route and page: never trust client-supplied claims alone.
- Validate user roles/permissions in `getServerSideProps` (or server components) before rendering protected pages.

### 2.4 Multi-Factor Authentication (MFA) (Future)

- Consider integrating an MFA layer (TOTP, SMS, or email OTP) for sensitive operations or admin accounts.

---

## 3. Input Validation & Output Encoding

- **Server-side validation**: Leverage `zod` or `yup` schemas to validate all API inputs, including authentication requests and dashboard data filters.
- **Prevent SQL injection**: Always use Drizzle ORM’s parameterized queries; avoid string interpolation in raw SQL.
- **Sanitize user-supplied HTML**: If rendering rich text, apply a whitelist sanitizer (e.g., DOMPurify).
- **Escape output**: Use Next.js’ default escaping for React, and explicitly encode any dynamic content included in HTML attributes.

---

## 4. Data Protection & Privacy

- **Encrypt in transit**: Mandate HTTPS/TLS 1.2+ for all endpoints. In Next.js, set `redirect: { permanent: true, destination: 'https://…' }` for HTTP->HTTPS.
- **Encrypt at rest**: Enable database-level encryption (e.g., AWS RDS encryption). Do not store PII or tokens in plaintext.
- **Secret management**: Migrate sensitive environment variables (DATABASE_URL, AUTH_JWT_SECRET) to a Secrets Manager (e.g., AWS Secrets Manager, Vault). Do not commit secrets into `.env`.
- **Minimal data retention**: Only store essential user data. Purge old sessions and verification tokens routinely.
- **PII handling**: Mask or redact PII in logs and error messages.

---

## 5. API & Service Security

- **Rate limiting**: Implement request throttling on authentication endpoints (e.g., 5 login attempts per minute) to mitigate brute-force.
- **CORS policy**: Restrict origins to the application’s domain. Configure `next.config.js` with `headers` to set `Access-Control-Allow-Origin`.
- **HTTP verbs**: Enforce `GET` for reads, `POST` for creation, `PUT/PATCH` for updates, and `DELETE` for removals. Reject mismatched verbs with `405 Method Not Allowed`.
- **Version your API**: Use `/api/v1/…` to manage backward-compatibility and deprecation.

---

## 6. Web Application Security Hygiene

- **CSRF protection**: Next.js API routes should validate anti-CSRF tokens (e.g., `next-csrf` or built-in solutions), especially for state-changing endpoints.
- **Security headers** (via `next.config.js` or custom server):
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy`: restrict scripts/styles to trusted sources, enable SRI for CDNs.
- **Cookie settings**: All cookies (session, JWT) should be `HttpOnly`, `Secure`, and set with `SameSite=Strict` where possible.
- **Client storage**: Avoid storing tokens in `localStorage`; prefer `HttpOnly` cookies or in-memory storage.

---

## 7. Infrastructure & Configuration Management

- **Harden containers**: Use minimal base images (e.g., `node:18-alpine`), regularly update to patch vulnerabilities.
- **Docker secrets**: Pass environment variables via Docker Secrets in production; avoid embedding sensitive data in `docker-compose.yaml`.
- **Network segmentation**: Expose only necessary ports (e.g., 80/443). Restrict PostgreSQL port (5432) to internal networks.
- **Disable dev modes**: Ensure `NODE_ENV=production`, disable Next.js telemetry and debug endpoints in production.
- **Automated updates**: Scan infrastructure images with Clair or Anchore; auto-rebuild on base image updates.

---

## 8. Dependency Management

- **Lockfiles**: Commit `package-lock.json` or `yarn.lock` to ensure reproducible builds.
- **Vulnerability scanning**: Integrate SCA tools (e.g., GitHub Dependabot, Snyk) to detect and auto-patch vulnerable dependencies.
- **Minimal footprint**: Audit and remove unused packages (e.g., large utility libraries not in active use).
- **Periodic reviews**: Schedule quarterly dependency reviews to upgrade to supported, actively maintained versions.

---

## 9. Logging, Monitoring & Incident Response

- **Structured logging**: Use a logger (e.g., `winston`, `pino`) with JSON output. Sanitize logs to exclude PII and secrets.
- **Alerting**: Configure alerts for repeated failed logins, unusual API error rates, or high resource usage.
- **Health checks**: Expose `/healthz` endpoint with minimal information; restrict access to internal monitoring.
- **Incident playbook**: Document steps for breach containment, key revocation (JWT secrets, DB credentials), and user notification procedures.

---

## 10. Testing & Continuous Integration

- **Automated tests**: Cover authentication flows, input validation, and RBAC. Use Jest + React Testing Library for unit tests; Playwright for end-to-end scenarios.
- **Security testing**: Integrate static analysis (ESLint security plugins), dynamic scanning (OWASP ZAP) into CI pipelines.
- **Code quality gates**: Enforce `lint`, `type-check`, and `test` steps before merges.

---

## Conclusion
Adhering to these guidelines will strengthen the security posture of the **paws-management** application. Regularly revisit and update controls in line with evolving threats, framework changes, and organizational policies. Security is a continuous process—embed these practices into daily development workflows to build and maintain a trusted platform.