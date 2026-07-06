## 1. Bootstrap module

- [x] 1.1 Create `src/modules/api/rest/identity-security/` directory
- [x] 1.2 Create `src/modules/api/rest/identity-security/types.ts` with prefixed `Security*` DTOs
- [x] 1.3 Create `src/modules/api/rest/identity-security/identitySecurity.ts` with REST call functions
- [x] 1.4 Create `src/modules/api/rest/identity-security/index.ts` to export public API

## 2. Wire top-level barrel

- [x] 2.1 Add `export * from "./identity-security"` to `src/modules/api/rest/index.ts`

## 3. Add SWR hooks

- [x] 3.1 Create query hooks in `src/hooks/swr/api/rest/queries/` for devices, login history, verification status, admin sessions, admin login history, and admin security log
- [x] 3.2 Create mutation hooks in `src/hooks/swr/api/rest/mutations/` for device trust/untrust/revoke, admin session revoke, admin lock/unlock

## 4. Verify

- [x] 4.1 Run `npx tsc --noEmit` and ensure no errors
- [x] 4.2 Run `npm run build -- --webpack` and ensure exit code 0
