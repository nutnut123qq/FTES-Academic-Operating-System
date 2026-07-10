## 1. On-this-page mobile mode

- [x] 1.1 Add a `mobile?: boolean` prop to `OnThisPage`; extract the rail body once
- [x] 1.2 When `mobile`, render a full-width panel (drop the `hidden w-64 lg:sticky lg:block` aside chrome); desktop keeps the `<aside>`

## 2. Mobile bar + shell wiring

- [x] 2.1 New `LearnShell/LearnMobileBar/index.tsx`: fixed `bottom-0 z-40 h-16 lg:hidden` bar; segment-gated; returns null off content routes
- [x] 2.2 Left drawer → `<ContentMap />` (content/modules routes); right drawer → `<OnThisPage mobile />` (lesson reader only)
- [x] 2.3 Render `<LearnMobileBar />` in `LearnShell` and add `max-lg:pb-16` when `!fullBleed`
- [x] 2.4 i18n for the two drawer triggers/headings (reuse `learn.contentMap.title` / `learn.onThisPage.title` where possible)

## 3. Lesson body rendering quality

- [x] 3.1 `LessonDocumentHtml`: extend the container descendant utilities into a full typography ladder (h2/h3/h4/code/pre/blockquote/img/table)
- [x] 3.2 `CodeToHtml`: replace `whitespace-pre-wrap`/`break-words` with `whitespace-pre` + `overflow-x-auto` (highlighted div + raw `<pre>` fallback)

## 4. Content-map continue action

- [x] 4.1 `ContentMap`: add a "continue learning" button in the pinned header linking to `header.continueLessonId`; hidden when null (reuse `content.continue`)

## 5. Dynamic challenges tab + header rhythm

- [x] 5.1 `LessonReader`: build `leftTabs.items` conditionally — omit the challenges tab when `!lesson.hasChallenge`
- [x] 5.2 `LessonReader`: snap the header→outcomes wrapper `gap-10` → `gap-6`

## 6. Verify

- [x] 6.1 `tsc --noEmit` clean
- [x] 6.2 `npm run build` (webpack) green
- [x] 6.3 `openspec validate lesson-reader-shell-mobile-render --strict` passes
