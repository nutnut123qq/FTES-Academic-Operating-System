# UserPromptSubmit hook — injected each turn to enforce the FTES AOS working agreement.
# stdout is added to the model's context. Keep it short.
Write-Output @"
[FTES AOS workflow — MANDATORY]
- Every change goes through OpenSpec: openspec new change -> artifacts -> /opsx:apply -> /opsx:archive.
- New FE code uses house skills: starci-fe-cannon-apply (code), starci-fe-ux-brainstorm/apply (layout), starci-fe-cannon-audit (legacy).
- Verify before commit: npm run build (webpack) green + tsc clean. One OpenSpec change per commit. No push/deploy without asking.
See CLAUDE.md.
"@
