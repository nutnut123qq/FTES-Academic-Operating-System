## 1. Event REST types

- [x] 1.1 Create `src/modules/api/rest/event/types.ts` with request/response interfaces inferred from backend `EventViews.java`. Prefix generic view names (`EventView`, `RegistrationView`, `CertificateView`, `AttendanceView`) to avoid barrel collisions.

## 2. Event REST client

- [x] 2.1 Create `src/modules/api/rest/event/event.ts` exporting REST functions for all endpoints in `EventController` and `EventAdminController`.
- [x] 2.2 Create `src/modules/api/rest/event/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./event"`.

### Endpoint mapping

**EventController:**
- `getEvents`, `getEventDetail`
- `registerEvent`, `cancelEventRegistration`, `getMyEventRegistrations`, `getEventRegistrationQr`
- `scanEventCheckin`
- `getMyEventCertificates`, `verifyEventCertificate`

**EventAdminController:**
- `createEvent`, `submitEvent`, `cancelEvent`, `setEventRecording`, `manualCheckinEvent`, `getEventAttendance`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostRegisterEventSwr.ts`
- [x] 3.2 Create `usePostCancelEventRegistrationSwr.ts`
- [x] 3.3 Create `usePostScanEventCheckinSwr.ts`
- [x] 3.4 Create `usePostCreateEventSwr.ts`
- [x] 3.5 Create `usePostSubmitEventSwr.ts`
- [x] 3.6 Create `usePostCancelEventSwr.ts`
- [x] 3.7 Create `usePostSetEventRecordingSwr.ts`
- [x] 3.8 Create `usePostManualCheckinEventSwr.ts`
- [x] 3.9 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetEventsSwr.ts`
- [x] 4.2 Create `useGetEventDetailSwr.ts`
- [x] 4.3 Create `useGetMyEventRegistrationsSwr.ts`
- [x] 4.4 Create `useGetEventRegistrationQrSwr.ts`
- [x] 4.5 Create `useGetMyEventCertificatesSwr.ts`
- [x] 4.6 Create `useGetEventAttendanceSwr.ts`
- [x] 4.7 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [ ] 5.2 Run `npm run build` (webpack) and ensure a green build.
