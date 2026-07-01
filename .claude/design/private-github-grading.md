# Spec — grade a PRIVATE GitHub repo (personal-project capstone)

Status: **BUILT — Option C (paste fine-grained token)** (2026-06-20). Backend tsc-clean (my files), FE
tsc+eslint clean, both messages JSON valid.

## What shipped (Option C)
**Backend (`starci-academy-backend`):**
- `enrollment.entity.ts`: `personalProjectGithubTokenEncrypted` (text, NOT `@Field`) +
  `personalProjectGithubTokenLast4` (`@Field` nullable) — mirrors BYOK secret storage.
- Migration `1718900000000-AddEnrollmentPersonalProjectGithubToken` (idempotent `ADD COLUMN`; dev uses
  `synchronize`, this is prod parity).
- `syncPersonalProjectGithub` mutation EXTENDED (no new tree): request `+githubToken/+clearGithubToken`;
  handler injects `EncryptionService` (globally available — no `CryptoModule` import, like two-factor),
  encrypts on write (`JSON.stringify(payload)` + `slice(-4)` last4), clears on `clearGithubToken`.
- `review-milestone-task-grade-step.service.ts`: `resolveGithubAccessToken(enrollmentId)` decrypts the
  learner token (falls back to org token on missing/decrypt-fail) → passed to `GithubRepoLoader.accessToken`.
  **The clone was already token-authed (org token); the change is whose token.**

**Frontend (`starci-academy`):**
- `SyncPersonalProjectGithubRequest` type `+githubToken/+clearGithubToken`.
- `usePersonalProjectGithubForm`: `saveGithubToken(token)` + `clearGithubToken()` + `tokenSaveStatus`
  (one-off save via the existing sync SWR + `runGraphQL` toast; NOT autosaved — it's a secret;
  revalidates enrollment status).
- `PersonalProjectSubmission`: a write-only "Token GitHub (repo riêng tư)" `type=password` field + Save +
  Remove. i18n keys `finalProject.page.submitGithub.privateToken*` (vi+en).

## Not done (follow-ups)
- **Auto-detect private → grant CTA after a 404** (currently the token field is always shown, not
  error-revealed). Backend pre-check `GET /repos/{owner}/{repo}` + surface `repoVisibility` to the FE.
- **Masked `••••last4` display + "đã lưu token" state** — needs `personalProjectGithubTokenLast4` added to
  the `courseEnrollmentStatus` query + FE enrollment type (column already exists + is `@Field`).
- **Log redaction**: confirm the tokenized clone never hits `GithubRepoLoader verbose:true` logs / winston
  `ProcessStepExecuted` payload. (Payload carries `githubUrl` not the token; token only lives in the
  decrypted local var — OK, but double-check `verbose:true` output.)

## Original spec (kept for reference)
Status before build: BRAINSTORM / awaiting A-vs-C pick (2026-06-20).

## Problem
The personal-project grader clones the learner's repo **by URL with no auth** → GitHub returns **404** for
private repos. To grade a private repo the clone must be authenticated with access the learner controls.

## Grounded backend trace (source of truth = `starci-academy-backend`)
- Submission stored on `enrollment`: `personal_project_github_url`, `personal_project_github_branch`
  (enrollment-level → per user×course).
- `reviewPersonalProjectTask` resolver → `ReviewPersonalProjectTaskHandler` → enqueues BullMQ job
  (`EnqueueReviewPersonalProjectTaskJobService`, queue `ReviewPersonalProjectTask`) with payload
  `{ enrollmentId, githubUrl, taskId, branch, locale, lang, ai }`.
- **The clone happens in the worker step:** `features/api/processors/ai/review-milestone-task/` →
  `steps/review-milestone-task-grade-step.service.ts` (consumes `payload.githubUrl`+`branch`,
  unauthenticated today). **← the one place that must learn to authenticate.**
- Existing GitHub infra: `GithubApiAuthService.exchangeOAuthCodeForAccessToken` (OAuth token exchange — token
  NOT persisted), `connectGithubAccount` (stores only `user.githubUsername`), org/app token
  `mountStorageService.githubAccessToken` (org-level, can't read a learner's private repo), `octokit` dep,
  `octokit.rest.repos.downloadTarballArchive` already used by `data-git` (ephemeral tarball + cleanup —
  reuse this for the clone). `resolve-github`/`revoke-github` processors = OPPOSITE direction (grant learner
  access to StarCi's course org), NOT relevant here.
- Encrypted-secret pattern already in repo: AI BYOK keys (write-only field, masked `••••last4`, encrypted at
  rest) — reuse verbatim for Option C.

## Options (pick one)
### A · GitHub App (recommended long-term, least-privilege)
- Register a StarCi GitHub App (`Contents: read`), private key → mount-secrets (like `githubSecretKey`).
- Grant flow: install page → user selects ONLY their repo → callback stores `enrollment.github_installation_id`.
- Grade step: App JWT → `POST /app/installations/{id}/access_tokens` (repo-scoped, ~1h) → clone
  `https://x-access-token:<tok>@github.com/owner/repo.git` (or tarball) → grade → token expires.
- ✅ per-repo, no stored long-lived secret, revoke = uninstall. ❌ **needs YOU to register the App** first.

### C · Paste fine-grained PAT (fastest, no external setup)
- User makes a GitHub fine-grained PAT (1 repo, `Contents: read`) → pastes into a **write-only** field
  (reuse BYOK secret UI) → encrypt at rest on enrollment (`personal_project_github_token_enc`).
- Grade step decrypts → clones with it → grades.
- ✅ no external infra, per-repo. ❌ manual (user creates token), tokens expire → re-entry.

### B · OAuth `repo` scope — **rejected** (scope grants ALL private repos; privacy smell).

## Backend delta (by option)
- **A:** new App registration + private key secret; `enrollment.github_installation_id` column (+ migration);
  GraphQL: `githubAppInstallUrl` query (builds install URL w/ `state`) + OAuth-style callback handler storing
  the installation id; grade step: mint installation token + authenticated clone; `revokeGithubInstallation`
  mutation (optional — uninstall is on GitHub).
- **C:** `enrollment.personal_project_github_token_enc` column (+ migration, encrypted via existing crypto);
  GraphQL: `syncPersonalProjectGithubToken` mutation (write-only, never returns the value) +
  `personalProjectGithubTokenLast4` field for the masked display + `clearPersonalProjectGithubToken`; grade
  step: decrypt + authenticated clone.
- **Both:** grade step uses the token/installation for clone; **ephemeral** dir → grade → delete; **redact**
  the tokenized URL from the `ProcessGitSubmissionStep` winston logs; optional pre-check
  `GET /repos/{owner}/{repo}` with the org token to detect private before the first run.

## FE delta (the "Github dự án" panel — `PersonalProjectSubmission` / `TaskSubmissionPanel`)
- State machine: URL → Đánh giá → (grade error `repo private/404`) → show **"Cấp quyền repo riêng tư"** →
  grant flow (A: redirect to install URL; C: a write-only token field + "how to make a token" link) →
  on return a **"🔒 Đã cấp quyền"** success chip → auto-retry Evaluate.
- Pre-check variant: if backend exposes `repoVisibility`, show the grant prompt up-front instead of after a
  failed run.
- Reuse the secret-field block (BYOK) for C's token input; reuse `useGraphQLWithToast` + `AsyncContent`/error
  conventions; i18n every string. Empty/loading/error + a11y from the start.

## Recommendation
Ship **C now** (no external setup, reuses the encrypted BYOK field end-to-end), move to **A** if private
repos get common. Skip B.
