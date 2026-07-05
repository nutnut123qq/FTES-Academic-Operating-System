## 1. Styling fix

- [x] 1.1 Add the HeroUI `popover` surface class to `Popover.Content` in `UserHovercard/index.tsx` and include `border-default` for a visible edge.
- [x] 1.2 Verify the popover arrow inherits the surface fill from the `.popover` CSS rule.

## 2. Verify build & behavior

- [x] 2.1 Run `npx tsc --noEmit` and fix any type errors.
- [x] 2.2 Run `npm run build` and confirm the webpack build is clean.
- [x] 2.3 Run `npm run dev`, open `/vi/community`, hover the name "Minh Trần", and confirm the card has an opaque surface, border/radius/shadow, matching arrow, and smooth fade/scale motion.
- [x] 2.4 Save a screenshot of the hovercard to `.tmp-screenshot/`.
