## 1. Career REST types

- [x] 1.1 Create `src/modules/api/rest/career/types.ts` with request/response interfaces inferred from `CareerController`, `CareerSkillController`, and career domain entities. Preserve StarCI field names (`starciRoadmapId`, `starciRef`, `starciSkillId`).

## 2. Career REST client

- [x] 2.1 Create `src/modules/api/rest/career/career.ts` exporting REST functions for all endpoints in `CareerController` and `CareerSkillController`.
- [x] 2.2 Create `src/modules/api/rest/career/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./career"`.

### Endpoint mapping

**CareerController:**
- `getCareerRoadmaps`, `getCareerRoadmapDetail`, `createCareerRoadmap`, `patchCareerRoadmap`, `enrollCareerRoadmap`, `getMyCareerRoadmaps`
- `getCareerOpportunities`, `createCareerOpportunity`, `patchCareerOpportunity`, `applyCareerOpportunity`, `getMyCareerApplications`, `getCareerApplication`, `patchCareerApplicationStatus`, `withdrawCareerApplication`
- `requestCareerMentor`, `patchCareerMentorship`
- `getMyCareerRecommendations`

**CareerSkillController:**
- `getCareerSkills`, `createCareerSkill`, `patchCareerSkill`, `getMyCareerSkills`, `submitCareerSelfAssessment`, `submitCareerMentorAssessment`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostCreateCareerRoadmapSwr.ts`
- [x] 3.2 Create `usePostPatchCareerRoadmapSwr.ts`
- [x] 3.3 Create `usePostEnrollCareerRoadmapSwr.ts`
- [x] 3.4 Create `usePostCreateCareerOpportunitySwr.ts`
- [x] 3.5 Create `usePostPatchCareerOpportunitySwr.ts`
- [x] 3.6 Create `usePostApplyCareerOpportunitySwr.ts`
- [x] 3.7 Create `usePostPatchCareerApplicationStatusSwr.ts`
- [x] 3.8 Create `usePostWithdrawCareerApplicationSwr.ts`
- [x] 3.9 Create `usePostRequestCareerMentorSwr.ts`
- [x] 3.10 Create `usePostPatchCareerMentorshipSwr.ts`
- [x] 3.11 Create `usePostCreateCareerSkillSwr.ts`
- [x] 3.12 Create `usePostPatchCareerSkillSwr.ts`
- [x] 3.13 Create `usePostSubmitCareerSelfAssessmentSwr.ts`
- [x] 3.14 Create `usePostSubmitCareerMentorAssessmentSwr.ts`
- [x] 3.15 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetCareerRoadmapsSwr.ts`
- [x] 4.2 Create `useGetCareerRoadmapDetailSwr.ts`
- [x] 4.3 Create `useGetMyCareerRoadmapsSwr.ts`
- [x] 4.4 Create `useGetCareerOpportunitiesSwr.ts`
- [x] 4.5 Create `useGetMyCareerApplicationsSwr.ts`
- [x] 4.6 Create `useGetCareerApplicationSwr.ts`
- [x] 4.7 Create `useGetMyCareerRecommendationsSwr.ts`
- [x] 4.8 Create `useGetCareerSkillsSwr.ts`
- [x] 4.9 Create `useGetMyCareerSkillsSwr.ts`
- [x] 4.10 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [ ] 5.2 Run `npm run build` (webpack) and ensure a green build.
