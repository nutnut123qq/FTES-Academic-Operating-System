## 1. Subject REST types

- [x] 1.1 Create `src/modules/api/rest/subject/types.ts` with request/response interfaces inferred from backend `SubjectDtos` and `WorkspaceDtos`.

## 2. Subject REST client

- [x] 2.1 Create `src/modules/api/rest/subject/subject.ts` exporting REST functions for all four subject controllers.
- [x] 2.2 Create `src/modules/api/rest/subject/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./subject"`.

### Endpoint mapping

**GraphQL-covered — KHÔNG có endpoint nào bị bỏ qua.** `src/modules/api/graphql/**` chưa có query/mutation cho subject; `mutation-purchase-membership` thuộc marketplace, không phải subject membership. Backend có `SubjectWorkspaceController` GraphQL resolver nhưng FE chưa consume.

**REST-only — implement trong `subject.ts`:**
- Catalog: `listSubjects`, `createSubject`, `getSubjectDetail`, `updateSubject`, `publishSubject`, `archiveSubject`, `replaceSubjectPrerequisites`, `replaceSubjectRelated`
- Workspace: `getSubjectWorkspace`, `getSubjectLinks`, `addSubjectLink`, `updateSubjectLink`, `deleteSubjectLink`
- Membership: `getMySubjects`, `joinSubject`, `leaveSubject`, `getSubjectMembers`, `changeSubjectMemberRole`, `banSubjectMember`
- Statistics: `getSubjectStatistics`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostCreateSubjectSwr.ts`
- [x] 3.2 Create `usePostUpdateSubjectSwr.ts`
- [x] 3.3 Create `usePostPublishSubjectSwr.ts`
- [x] 3.4 Create `usePostArchiveSubjectSwr.ts`
- [x] 3.5 Create `usePostReplaceSubjectPrerequisitesSwr.ts`
- [x] 3.6 Create `usePostReplaceSubjectRelatedSwr.ts`
- [x] 3.7 Create `usePostAddSubjectLinkSwr.ts`
- [x] 3.8 Create `usePostUpdateSubjectLinkSwr.ts`
- [x] 3.9 Create `usePostDeleteSubjectLinkSwr.ts`
- [x] 3.10 Create `usePostJoinSubjectSwr.ts`
- [x] 3.11 Create `usePostLeaveSubjectSwr.ts`
- [x] 3.12 Create `usePostChangeSubjectMemberRoleSwr.ts`
- [x] 3.13 Create `usePostBanSubjectMemberSwr.ts`
- [x] 3.14 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new hooks.

## 4. Verification

- [x] 4.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 4.2 Run `npm run build` (webpack) and ensure a green build.
