## Context
Subject Workspace = subject-first community hub (join like a community; moderators
upload materials + challenges; students practice). Distinct from Course (buy → learn).
The overview is the landing tab. Direction A chosen with the teacher (2026-07-02).

## Goals / Non-Goals
**Goals:** community-hub feel — join banner + discussion feed + resource/challenge/
member shortcuts, inside the existing shell, build green, FE mock.
**Non-Goals:** real posting/joining, real moderation, real resource/challenge data.

## Decisions
- **Renders inside `SubjectWorkspaceShell`** (sidebar + identity header already there);
  this change only redesigns the overview content region.
- **page.tsx → thin mount shell** (`<SubjectOverview />`), moving logic out of the
  route file (fixes the prior inline-logic drift; canon 1.6).
- **Two-column hub:** join banner (accent tint + "Đăng bài") → `md:grid-cols-3`, feed
  `col-span-2` (pinned moderator post in an accent card + recent post rows) + a rail
  `col-span-1` of shortcut cards (new resources, featured challenges, active members),
  each linking to its full tab.
- **Feed rows hand-rolled** to match the sibling `SubjectCommunity` idiom (initials
  avatar + author/time + title + snippet + reaction counts) — same domain, one look.
- **Challenge difficulty → chip color** (easy=success, medium=warning, hard=danger).

## Risks / Trade-offs
- Mock data; compose + shortcut rows navigate or no-op — logged with ponytail markers.
- Chose a dedicated overview mock hook over composing 4 tab hooks — simpler single
  AsyncContent, one curated payload matching the hub; swap to real BE later.
