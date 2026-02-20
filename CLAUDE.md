# CLAUDE.md — DareDev256 System Directives

## PROTECTED CONFIGURATION — DO NOT MODIFY

These items have been broken by automated agents before. Do NOT change them:

1. **No COEP header** — Do NOT add `Cross-Origin-Embedder-Policy` to `vercel.json`. It breaks YouTube embeds. This has been fixed TWICE already.
2. **No iframe sandbox** — Do NOT add `sandbox` attribute to YouTube `<iframe>` elements. CSP headers provide sufficient security.
3. **No Trusted Types CSP** — Do NOT add `require-trusted-types-for 'script'` to Content-Security-Policy. It blocks YouTube IFrame API (`document.head.appendChild(script)`) and Three.js (`innerHTML` operations). Broke all video playback in v3.18.2.
4. **No `referrerPolicy="no-referrer"` on iframes** — YouTube requires the `Referer` header since late 2025. Use `referrerPolicy="strict-origin-when-cross-origin"` on ALL YouTube iframe embeds. `no-referrer` causes Error 153 (Video player configuration error). Broke all video playback in v3.18.1.
5. **Server `Referrer-Policy` must stay `strict-origin-when-cross-origin`** — Do NOT change it to `no-referrer` or `same-origin`. Same reason as #4.
6. **Photography is LOCKED** — The `/photos` route and Photography card on HubPage are intentionally disabled (Coming Soon). Do NOT re-enable without explicit owner approval.
7. **videos.json integrity** — Do NOT modify `youtubeId` fields. Every `youtubeId` must be exactly 11 characters matching `[A-Za-z0-9_-]{11}`.
8. **Removed features — do NOT re-add** — CultureQueue, CollabWeb, ProductionPulse, NowPlayingOverlay were removed from HubPage in v3.20.0 per owner request.
9. **CSP `connect-src` MUST include `cdn.jsdelivr.net`** — Troika (drei's `<Text>` component) fetches fonts from jsdelivr inside Web Workers at runtime. Worker `fetch()` calls are governed by `connect-src`, not `font-src`. Removing jsdelivr breaks ALL 3D text labels. This has now been broken and fixed TWICE (v3.16.0 added it, v3.22.0 wrongly removed it). Do NOT remove it again regardless of "not found in source code" reasoning — it's a runtime dependency loaded by a third-party library inside a Worker.

## VIDEO PLAYBACK — THE #1 PRIORITY

This is a **music video portfolio**. If videos don't play, the site is broken. Period.

### Mandatory: Run video playback tests after ANY change
```bash
npx vitest run src/utils/videoPlayback.test.js
```
This test suite (18 tests) guards every configuration that has broken video playback before:
- CSP directives (Trusted Types, frame-src, script-src, img-src)
- Referrer policy (server header + per-iframe attribute)
- iframe sandbox (must not exist)
- YouTube embed URL format
- Video data integrity (valid IDs, no duplicates)

**If any of these tests fail, your change WILL break video playback in production.** Fix your change, not the test.

### Security changes require extra care
Security hardening on this project has broken videos **three times** (COEP, Trusted Types, referrer policy). Before making ANY security-related change to `vercel.json`, CSP headers, or iframe attributes:
1. Run `npx vitest run src/utils/videoPlayback.test.js` BEFORE your change
2. Make your change
3. Run the tests again AFTER
4. If any test fails, your security change is incompatible with YouTube embeds — revert it

## CORE PRINCIPLE: TOOL-FIRST EXECUTION

Before writing ANY code, making ANY plan, or assigning ANY agent task:

1. **Inventory available tools** — List every MCP server, skill, and integration currently connected
2. **Map tasks to tools** — For each step in your plan, ask: "Is there a tool that does this better/faster than manual?"
3. **Document the mapping** — Show me which tool handles which task and why
4. **Never skip a tool opportunity** — If a tool exists for a subtask, use it. Don't default to manual.

## PLANNING PROTOCOL

Every plan must include a **Tool Orchestration Table**:

| Step | Task | Tool/MCP | Justification |
|------|------|----------|---------------|
| ...  | ...  | ...      | ...           |

This applies whether you're:
- Working solo or assigning sub-agents
- Doing a quick fix or a full build
- Writing code, researching, testing, or deploying

## AGENT ASSIGNMENT RULES

When using multi-agent / parallel execution:
- Each agent's brief MUST specify which tools it should use
- Agents must check Context7 / latest docs before implementing anything library-specific
- Agents must use browser automation for any visual or behavioral testing
- Agents must use file search before manually grepping

## TOOL TRIGGER EXPANSION

Do NOT wait for keyword triggers. Proactively use tools when the task involves:

| Task Pattern | Tool to Use |
|-------------|-------------|
| Any library/framework usage | Context7 → check latest docs first |
| SEO, competitor analysis, current info | Web search + web fetch |
| Visual testing, responsiveness, Lighthouse | Browser automation |
| Finding files, patterns, secrets | File search / Desktop Commander |
| Bulk file operations | Desktop Commander / file system tools |
| Git operations | Terminal / git tools |
| Checking API behavior | Web fetch |
| Running tests, builds, audits | Terminal / process management |
| Reading project structure | Directory listing tools |

## GIT COMMIT PROTOCOL (MANDATORY — EVERY PUSH)

Every time you commit and push, you MUST also:

1. **README.md** — Review and update if ANY of the following changed:
   - Features added/removed/modified
   - Tech stack changes (new dependencies, framework upgrades)
   - Setup/install instructions affected
   - API endpoints or environment variables changed
   - Screenshots or demos are now outdated
2. **CHANGELOG.md** — Add a dated entry summarizing what changed, added, fixed, or removed
3. **Version / Releases** — If the project uses semantic versioning, package.json version, or GitHub releases:
   - Bump the version appropriately (patch for fixes, minor for features, major for breaking changes)
   - Ensure version numbers are consistent across package.json, CHANGELOG, and any release tags
   - If a GitHub release is warranted (significant feature or milestone), create one
4. **Final check** — Before pushing, verify:
   - README accurately reflects the current state of the project
   - No stale version numbers or outdated instructions remain
   - CHANGELOG has no gaps

This is NOT optional. Do not ask whether to do this. Do it automatically on every push.

## SECURITY PROTOCOL (MANDATORY — EVERY PROJECT)

Security is not a separate task. It is embedded in every build, deploy, and commit cycle.

### Pre-Build Security Checks
Before writing or modifying any project code:
1. **Dependency audit** — Run `npm audit` (Node) or equivalent. Flag critical/high severity. Fix or document exceptions.
2. **Secret scan** — Search entire codebase for exposed API keys, tokens, passwords, .env contents. Use file search tools, not manual grep.
   - Check: `.env`, hardcoded strings, config files, commit history
   - Block patterns: `sk-`, `ghp_`, `AKIA`, `Bearer`, private keys, database URIs
3. **Lock file integrity** — Verify `package-lock.json` / `yarn.lock` exists and is committed. No floating versions in production.

### Web Application Security (OWASP-Aligned)
When building or modifying any web-facing project, verify:

**HTTP Security Headers** (non-negotiable for any deployed site):
- `Content-Security-Policy` — Restrict script/style/font/image sources. No `unsafe-inline` or `unsafe-eval` in production.
- `Strict-Transport-Security` — `max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — Disable camera, microphone, geolocation unless explicitly needed

**Input & Output**:
- Sanitize ALL user inputs (forms, URL params, query strings)
- Parameterize database queries (no string concatenation SQL)
- Encode output to prevent XSS
- Validate file uploads (type, size, content)

**Authentication & Sessions** (if applicable):
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`
- Session timeout and rotation
- Rate limiting on auth endpoints

**Infrastructure**:
- HTTPS everywhere, no mixed content
- CORS configured to minimum necessary origins
- Error pages don't leak stack traces, paths, or versions
- Directory listing disabled

### Post-Build Security Verification
After any deployment or significant change:
1. **Header check** — Use Mozilla Observatory API or `curl -I` to verify all security headers are present and correctly configured
2. **Dependency re-audit** — Run `npm audit` again after installing anything new
3. **Lighthouse security** — Check via browser automation if available
4. **No secrets in build output** — Verify no credentials in bundled JS, HTML source, or public assets

### Security Tools Priority
When security scanning is needed, use in this order:
1. `npm audit` — Built-in, instant, zero config (always run this)
2. `trivy fs .` — Open source, scans deps + secrets + misconfigs in one pass
3. `snyk test` — If authenticated, precision patches and deeper analysis
4. Mozilla Observatory API — For deployed sites, header scoring
5. Browser automation — Visual verification of security behavior (redirects, cookie flags, error handling)

### Claude Code / MCP Security
When operating as an agent:
- Never store or transmit credentials in plain text
- Never auto-approve commands involving `curl`, `wget`, network requests, or `sudo` without review
- Block access to `~/.ssh/`, `~/.aws/`, `~/.gnupg/`, and credential stores
- Only enable MCP servers that are explicitly trusted and needed
- Review any third-party MCP server source before enabling
- Log all destructive operations (file deletions, permission changes, deployments)

This protocol applies to EVERY project. Do not skip security steps because the project "seems simple."

## PROJECT CONVENTIONS

- **Owner**: DareDev256 (Toronto-based AI Solutions Engineer & Creative Technologist)
- **Git workflow**: Always commit with detailed messages, update README + CHANGELOG on significant changes
- **Testing**: Test before committing. Use automation tools for testing when available.
- **Quality bar**: Production-grade. No placeholder code, no TODOs left behind.
- **Communication style**: Direct, no fluff. State what you did, what changed, what to watch for.

## MACHINE CONTEXT

This CLAUDE.md applies on:
- **MacBook Pro** (primary development machine)
- **Mac Mini** (via SSH — autonomous agent operations / Passion Agent)

When operating via SSH on the Mac Mini, the same tool-first protocol applies.
Adapt tool usage to what's available in the SSH session context.
