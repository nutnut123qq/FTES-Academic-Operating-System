## 1. Scaffold Platform REST module

- [x] 1.1 Create `src/modules/api/rest/platform/` directory with `types.ts`, `platform.ts`, and `index.ts`.
- [x] 1.2 Define all request/response types in `types.ts` with the `Platform*` prefix.
- [x] 1.3 Implement REST call functions in `platform.ts` using `restRequest`.

## 2. Add SWR hooks

- [x] 2.1 Create query hooks in `src/hooks/swr/api/rest/queries/` for all read endpoints.
- [x] 2.2 Create mutation hooks in `src/hooks/swr/api/rest/mutations/` for all write endpoints.

## 3. Wire up exports and verify

- [x] 3.1 Re-export the new module from `src/modules/api/rest/index.ts`.
- [x] 3.2 Run `npx tsc --noEmit` and fix any type errors.
- [x] 3.3 Run `npm run build -- --webpack` and fix any build errors.
