# decision/ — decision logs: WHY a scenario chose a component

This is the house's **design decision memory**. One file per block family (`<block>.md`). Each holds the
records of *"for scenario X we chose component Y, shaped like this, because Z"* — learned from the teacher's
feedback. Reading these before a new design means the AI **reuses the house's logic instead of re-deciding
(or guessing).** This is the core of "force the AI to self-learn".

| File | Block family (`src/components/blocks/…`) |
|---|---|
| `card.md` | cards — Course/Pricing/Media/Continue/Labeled/Flip/Pressable |
| `sidebar.md` | navigation — CollapsibleSidebar + groups/items |
| `tabs.md` | navigation — TabsCard / ExtendedTabs |
| `accordion.md` | navigation — ContentMapRow + HeroUI Accordion |
| `chip.md` | chips — Status/Difficulty/Language |
| `button.md` | buttons — FAB / Rating / InputButtonLike |
| `list.md` | lists — ListRow / PaginatedList |
| `feed.md` | feed — Activity/Chat/Timeline/Reaction |
| `stat.md` | stats — Metric/Progress/Chart/Roadmap |
| `page-header.md` | layout — PageHeader/Container/StickyBar |
| `empty-state.md` | async + feedback — loading/empty/error |
| `skeleton.md` | skeleton loaders |
| `avatar.md` | identity — avatars/user cells/uploads |
| `banner.md` | marketing — heroes/pitch/manifesto |
| `media.md` | media — cover images |
| `overlay.md` | modal · drawer · popover shells |

**How it grows:** at the END of `/starci-fe-ux-apply`, the decision for each block touched (scenario →
choice → why) is appended to the matching `<block>.md`. **Automatic, no command.** A new block in the system?
add a `<block>.md`.

> `design/` (page UX) + `ui/` (visual system) are the siblings: page-level UX/layout decisions + UX patterns fetched from the web.
> `../../cannon/CONTENT.md` is the code-rule layer (separate concern).
