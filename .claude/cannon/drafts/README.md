# cannon/drafts/ — staging for new code-pattern rules

Stage new FE **code-pattern** conventions here as `<kebab-name>.md` while coding — never edit
`../CONTENT.md` (the stable canon) in place mid-build.

Each draft should carry, when known:
- a one-line **target**: which `CONTENT.md` SLICE it belongs to (e.g. "§ đích: SLICE 3 Data Fetching")
- the **RULE** + a real `src/...` example + **DO/DON'T** + the **VIOLATION** an audit should flag
- a date, so newest-wins on conflict

Optional mid-work scratch — at the END of the task `/starci-fe-ux-apply` folds every draft here into
`../CONTENT.md` (the right slice + Appendix A ledger), reconciles conflicts (newest wins), and deletes the
merged drafts. No command.
