## Why
The navbar Logo and every "go home" link build `pathConfig().locale().home()` →
`/[locale]/home`, but that route doesn't exist — the strip refactor (12c485b) deleted
`app/[locale]/home/` and moved the landing to the locale root. Result: clicking the
logo lands on `/en/home` → 404 (a blank "This page could not be found").

## What Changes
- Restore `app/[locale]/home/page.tsx` as a thin shell rendering `HomeLanding` (the
  same landing as the root), so the ungated `/home` url resolves again.

## Capabilities
### New Capabilities
- (none)
### Modified Capabilities
- (none — route restoration / bugfix)

## Impact
FE only. One route file. Build stays green. Fixes the logo/home 404 on Vercel.
