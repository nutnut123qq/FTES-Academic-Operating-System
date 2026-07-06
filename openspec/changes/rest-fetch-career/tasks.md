## 1. Career REST types

- [ ] 1.1 Create `src/modules/api/rest/career/types.ts` with request/response interfaces inferred from `CareerController`, `CareerSkillController`, and career domain entities. Preserve StarCI field names (`starciRoadmapId`, `starciRef`, `starciSkillId`).

## 2. Career REST client

- [ ] 2.1 Create `src/modules/api/rest/career/career.ts` exporting REST functions for all endpoints in `CareerController` and `CareerSkillController`.
- [ ] 2.2 Create `src/modules/api/rest/career/index.ts` barrel re-exporting types and functions.
- [ ] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./career"`.

### Endpoint mapping

**CareerController:**
- `getCareerRoadmaps`, `getCareerRoadmapDetail`, `createCareerRoadmap`, `patchCareerRoadmap`, `enrollCareerRoadmap`, `getMyCareerRoadmaps`
- `getCareerOpportunities`, `createCareerOpportunity`, `patchCareerOpportunity`, `applyCareerOpportunity`, `getMyCareerApplications`, `getCareerApplication`, `patchCareerApplicationStatus`, `withdrawCareerApplication`
- `requestCareerMentor`, `patchCareerMentorship`
- `getMyCareerRecommendations`

**CareerSkillController:**
- `getCareerSkills`, `createCareerSkill`, `patchCareerSkill`, `getMyCareerSkills`, `submitCareerSelfAssessment`, `submitCareerMentorAssessment`

## 3. SWR mutation wrappers

- [ ] 3.1 Create `usePostCreateCareerRoadmapSwr.ts`
- [ ] 3.2 Create `usePostPatchCareerRoadmapSwr.ts`
- [ ] 3.3 Create `usePostEnrollCareerRoadmapSwr.ts`
- [ ] 3.4 Create `usePostCreateCareerOpportunitySwr.ts`
- [ ] 3.5 Create `usePostPatchCareerOpportunitySwr.ts`
- [ ] 3.6 Create `usePostApplyCareerOpportunitySwr.ts`
- [ ] 3.7 Create `usePostPatchCareerApplicationStatusSwr.ts`
- [ ] 3.8 Create `usePostWithdrawCareerApplicationSwr.ts`
- [ ] 3.9 Create `usePostRequestCareerMentorSwr.ts`
- [ ] 3.10 Create `usePostPatchCareerMentorshipSwr.ts`
- [ ] 3.11 Create `usePostCreateCareerSkillSwr.ts`
- [ ] 3.12 Create `usePostPatchCareerSkillSwr.ts`
- [ ] 3.13 Create `usePostSubmitCareerSelfAssessmentSwr.ts`
- [ ] 3.14 Create `usePostSubmitCareerMentorAssessmentSwr.ts`
- [ ] 3.15 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [ ] 4.1 Create `useGetCareerRoadmapsSwr.ts`
- [ ] 4.2 Create `useGetCareerRoadmapDetailSwr.ts`
- [ ] 4.3 Create `useGetMyCareerRoadmapsSwr.ts`
- [ ] 4.4 Create `useGetCareerOpportunitiesSwr.ts`
- [ ] 4.5 Create `useGetMyCareerApplicationsSwr.ts`
- [ ] 4.6 Create `useGetCareerApplicationSwr.ts`
- [ ] 4.7 Create `useGetMyCareerRecommendationsSwr.ts`
- [ ] 4.8 Create `useGetCareerSkillsSwr.ts`
- [ ] 4.9 Create `useGetMyCareerSkillsSwr.ts`
- [ ] 4.10 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [ ] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [ ] 5.2 Run `npm run build` (webpack) and ensure a green build.
