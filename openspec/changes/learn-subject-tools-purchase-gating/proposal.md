# learn-subject-tools-purchase-gating — Wire learn-page subject tools + purchase gating

## Why
`course.subjectCode` is now backfilled (BE V270), so the learn-page right rail can
surface the linked subject's workplace. StarCi shows a rich subject-tools rail; FTES
only wired "Ôn tập" + "Hỏi đáp". We also need the moment-of-need purchase nudges the
BE now supports: a per-material lock flag (CONTRACT B `ResourceSummary.lockedForViewer`)
and a subject cover image (CONTRACT A `SubjectDetail.imageUrl`), plus a trial→buy card
on the learn content home for viewers who have not purchased.

## What Changes
- **LearnToolsRail** (`LearnToolsRail/index.tsx`): retarget the subject group to
  `Học liệu / Ôn tập` → `/subjects/{code}/resources`, `Flashcard / Luyện tập` →
  `/subjects/{code}/practice`, `Không gian môn học` → `/subjects/{code}`, keep
  `Hỏi đáp` → `/subjects/{code}/discussion`. Add two LOCKED rows (Playground, Dự án
  cá nhân) with a `LockSimpleIcon` marker (house no-emoji rule) that, on press, open
  the whole-course buy flow via a mounted `PackageGateModal` (`packageSlugs: []` →
  `WholeCourseGateCard` COURSE_UNLOCK) instead of navigating. The whole subject group
  is hidden only when `subjectCode` is null.
- **LearnContentPage** (`LearnContentPage/index.tsx`): add a "Bạn đang học thử / Mở
  khóa học" trial→buy card shown ONLY to non-purchasers (hidden for purchasers),
  reusing `useCourseEnrollment` + `PriceTag`. Continue/progress/about kept intact.
  Copy is enroll/unlock, never "VIP" (rule premium-unlock-is-enroll-not-vip).
- **useQueryLearnCourseSwr**: surface `coverUrl` / `priceVnd` / `originalVnd` (from the
  already-loaded course detail — no extra call) and compose
  `useGetMyCourseAccessSwr(rawId)` → `access {enrolled,purchased,fullAccess}`.
- **CONTRACT B** — SubjectResources: badge `lockedForViewer` materials with a lock chip,
  withhold every body/URL affordance (download / ask-AI / save) on a locked row, and
  route its click to the subject's linked course `/courses/{courseLinks[0].id}` buy page;
  inert with a muted hint when no course is linked.
- **CONTRACT A** — Subject workspace header: render `SubjectDetail.imageUrl` (fallback
  `thumbnailUrl`) via a plain `<img>` (no Next optimizer) so a remote BE host renders;
  keep the initials-badge fallback.
- i18n `learn.toolsRail.*`, `learn.content.trialCard.*`, `subjects.resources.locked*`
  (vi + en).

## Impact
FE only. Consumes BE CONTRACT A (`SubjectDetail.imageUrl`) and CONTRACT B
(`ResourceSummary.lockedForViewer`) additively — the FE degrades gracefully (initials
badge / no lock) where the fields are not yet deployed. No new API is assumed present
beyond `GET /courses/{id}/me/access`, which was already wired. Build + tsc stay green.
