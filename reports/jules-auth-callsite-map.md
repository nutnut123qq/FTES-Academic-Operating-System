# Báo cáo Census API Layer (restRequest)

## Task 1 & 2: Danh sách các endpoint

| Hàm | Method | URL | Cờ authenticated | File:line | Khách vãng lai gọi được? | Đường dẫn tới route |
|---|---|---|---|---|---|---|
| getActivityTimeline | GET | /activities | true | src/modules/api/rest/activity/activity.ts:19 | Không (bị chặn) | /activity/page.tsx |
| getActivity | GET | /activities/${eventId} | true | src/modules/api/rest/activity/activity.ts:34 | Chưa rõ | Không tìm thấy |
| getActivityTypes | GET | /activities/types | true | src/modules/api/rest/activity/activity.ts:41 | Không (bị chặn) | /activity/page.tsx |
| getActivityPrivacySettings | GET | /activities/privacy-settings | true | src/modules/api/rest/activity/activity.ts:50 | Chưa rõ | Không tìm thấy |
| updateActivityPrivacySettings | PUT | /activities/privacy-settings | bỏ trống→true | src/modules/api/rest/activity/activity.ts:59 | Chưa rõ | Không tìm thấy |
| replayActivities | POST | /activities/replay | bỏ trống→true | src/modules/api/rest/activity/activity.ts:68 | Chưa rõ | Không tìm thấy |
| createAdminBanner | POST | /admin/banners | bỏ trống→true | src/modules/api/rest/admin/admin.ts:25 | Chưa rõ | Không tìm thấy |
| patchAdminBanner | PATCH | /admin/banners/${id} | bỏ trống→true | src/modules/api/rest/admin/admin.ts:35 | Chưa rõ | Không tìm thấy |
| deleteAdminBanner | DELETE | /admin/banners/${id} | bỏ trống→true | src/modules/api/rest/admin/admin.ts:45 | Chưa rõ | Không tìm thấy |
| createAdminAnnouncement | POST | /admin/announcements | bỏ trống→true | src/modules/api/rest/admin/admin.ts:56 | Chưa rõ | Không tìm thấy |
| patchAdminAnnouncement | PATCH | /admin/announcements/${id} | bỏ trống→true | src/modules/api/rest/admin/admin.ts:66 | Chưa rõ | Không tìm thấy |
| publishAdminAnnouncement | POST | /admin/announcements/${id}/publish | bỏ trống→true | src/modules/api/rest/admin/admin.ts:75 | Chưa rõ | Không tìm thấy |
| deleteAdminAnnouncement | DELETE | /admin/announcements/${id} | bỏ trống→true | src/modules/api/rest/admin/admin.ts:84 | Chưa rõ | Không tìm thấy |
| bulkLockAdminUsers | POST | /admin/users/bulk/lock | bỏ trống→true | src/modules/api/rest/admin/admin.ts:95 | Chưa rõ | Không tìm thấy |
| bulkUnlockAdminUsers | POST | /admin/users/bulk/unlock | bỏ trống→true | src/modules/api/rest/admin/admin.ts:104 | Chưa rõ | Không tìm thấy |
| confirmAdminBulkOperation | POST | /admin/bulk/${bulkId}/confirm | bỏ trống→true | src/modules/api/rest/admin/admin.ts:114 | Chưa rõ | Không tìm thấy |
| getAdminPublicBanners | GET | /admin-content/banners | bỏ trống→true | src/modules/api/rest/admin/admin.ts:125 | Chưa rõ | Không tìm thấy |
| getAdminPublicAnnouncements | GET | /admin-content/announcements/active | bỏ trống→true | src/modules/api/rest/admin/admin.ts:136 | Chưa rõ | Không tìm thấy |
| getAdminAnalyticsDashboards | GET | /admin/analytics/dashboards | bỏ trống→true | src/modules/api/rest/admin/admin.ts:144 | Chưa rõ | Không tìm thấy |
| getAdminAnalyticsDashboard | GET | /admin/analytics/dashboards/${key} | bỏ trống→true | src/modules/api/rest/admin/admin.ts:153 | Chưa rõ | Không tìm thấy |
| createSession | POST | /ai/sessions | bỏ trống→true | src/modules/api/rest/ai/ai.ts:37 | Không (bị chặn) | Không tìm thấy |
| getSessions | GET | /ai/sessions | true | src/modules/api/rest/ai/ai.ts:154 | Chưa rõ | Không tìm thấy |
| listAiSessions | GET | /ai/sessions | true | src/modules/api/rest/ai/ai.ts:185 | Không (bị chặn) | Không tìm thấy |
| deleteAiSessions | DELETE | /ai/sessions | bỏ trống→true | src/modules/api/rest/ai/ai.ts:209 | Chưa rõ | Không tìm thấy |
| getSession | GET | /ai/sessions/${id} | true | src/modules/api/rest/ai/ai.ts:216 | Chưa rõ | Không tìm thấy |
| archiveSession | DELETE | /ai/sessions/${id} | bỏ trống→true | src/modules/api/rest/ai/ai.ts:223 | Chưa rõ | Không tìm thấy |
| submitJob | POST |  | bỏ trống→true | src/modules/api/rest/ai/ai.ts:231 | Chưa rõ | Không tìm thấy |
| getCareerSuggestion | POST | /ai/career/suggestion | bỏ trống→true | src/modules/api/rest/ai/ai.ts:258 | Chưa rõ | Không tìm thấy |
| getJob | GET | /ai/jobs/${id} | true | src/modules/api/rest/ai/ai.ts:274 | Chưa rõ | Không tìm thấy |
| createStudyPlan | POST | /ai/learning/study-plan | true | src/modules/api/rest/ai/ai.ts:297 | Chưa rõ | Không tìm thấy |
| getStudyPlans | GET | /ai/learning/study-plans | true | src/modules/api/rest/ai/ai.ts:310 | Chưa rõ | Không tìm thấy |
| getStudyPlan | GET | /ai/learning/study-plans/${id} | true | src/modules/api/rest/ai/ai.ts:319 | Chưa rõ | Không tìm thấy |
| patchStudyPlanProgress | PATCH | /ai/learning/study-plans/${id}/progress | true | src/modules/api/rest/ai/ai.ts:334 | Chưa rõ | Không tìm thấy |
| archiveStudyPlan | DELETE | /ai/learning/study-plans/${id} | true | src/modules/api/rest/ai/ai.ts:343 | Chưa rõ | Không tìm thấy |
| getMyAiQuota | GET | /ai/quotas/me | true | src/modules/api/rest/ai/ai.ts:352 | Có | /ai/page.tsx |
| requestTranscript | POST | /ai/learning/transcript | bỏ trống→true | src/modules/api/rest/ai/ai.ts:363 | Chưa rõ | Không tìm thấy |
| getTranscript | GET | /ai/learning/transcript/${lessonId} | true | src/modules/api/rest/ai/ai.ts:370 | Chưa rõ | Không tìm thấy |
| askDocumentQa | POST | /ai/document-qa | true | src/modules/api/rest/ai/ai.ts:394 | Không (bị chặn) | Không tìm thấy |
| listAiCatalogModels | GET | /ai/models | true | src/modules/api/rest/ai/ai.ts:410 | Không (bị chặn) | /courses/[courseId]/learn/layout.tsx |
| gradeCode | POST | /ai/coding/grade-code | true | src/modules/api/rest/ai/ai.ts:430 | Không (bị chặn) | Không tìm thấy |
| executeCode | POST | /ai/coding/execute-code | true | src/modules/api/rest/ai/ai.ts:454 | Không (bị chặn) | Không tìm thấy |
| runTests | POST | /ai/coding/run-tests | true | src/modules/api/rest/ai/ai.ts:476 | Chưa rõ | Không tìm thấy |
| executeSql | POST | /ai/coding/execute-sql | true | src/modules/api/rest/ai/ai.ts:499 | Chưa rõ | Không tìm thấy |
| sqlSchema | POST | /ai/coding/sql-schema | true | src/modules/api/rest/ai/ai.ts:517 | Chưa rõ | Không tìm thấy |
| listModelConfigs | GET | /ai/admin/model-configs | true | src/modules/api/rest/ai/ai.ts:528 | Chưa rõ | Không tìm thấy |
| updateModelConfig | PUT | /ai/admin/model-configs/${feature} | bỏ trống→true | src/modules/api/rest/ai/ai.ts:538 | Chưa rõ | Không tìm thấy |
| getAiInsights | GET | /ai/admin/insights | true | src/modules/api/rest/ai/ai.ts:545 | Chưa rõ | Không tìm thấy |
| listAnalyticsDashboards | GET | /analytics/dashboards | true | src/modules/api/rest/analytics/analytics.ts:16 | Chưa rõ | Không tìm thấy |
| getAnalyticsDashboard | GET | /analytics/dashboards/${domain} | true | src/modules/api/rest/analytics/analytics.ts:32 | Chưa rõ | Không tìm thấy |
| getAnalyticsExportStatus | GET | /analytics/exports/${jobId} | true | src/modules/api/rest/analytics/analytics.ts:79 | Chưa rõ | Không tìm thấy |
| getBlogPosts | GET | /blog/posts | false | src/modules/api/rest/blog/blog.ts:29 | Chưa rõ | Không tìm thấy |
| searchBlogPosts | GET | /blog/posts/search | false | src/modules/api/rest/blog/blog.ts:49 | Chưa rõ | Không tìm thấy |
| getBlogPostBySlug | GET | /blog/posts/${slug} | false | src/modules/api/rest/blog/blog.ts:66 | Có | /blog/[slug]/page.tsx |
| createBlogPost | POST | /blog/posts | bỏ trống→true | src/modules/api/rest/blog/blog.ts:77 | Chưa rõ | Không tìm thấy |
| updateBlogPost | PUT | /blog/posts/${id} | bỏ trống→true | src/modules/api/rest/blog/blog.ts:87 | Chưa rõ | Không tìm thấy |
| publishBlogPost | PATCH | /blog/posts/${id}/publish | bỏ trống→true | src/modules/api/rest/blog/blog.ts:97 | Chưa rõ | Không tìm thấy |
| deleteBlogPost | DELETE | /blog/posts/${id} | bỏ trống→true | src/modules/api/rest/blog/blog.ts:104 | Chưa rõ | Không tìm thấy |
| getBlogCategories | GET | /blog/categories | bỏ trống→true | src/modules/api/rest/blog/blog.ts:112 | Chưa rõ | Không tìm thấy |
| createBlogCategory | POST | /blog/categories | bỏ trống→true | src/modules/api/rest/blog/blog.ts:120 | Chưa rõ | Không tìm thấy |
| updateBlogCategory | PUT | /blog/categories/${id} | bỏ trống→true | src/modules/api/rest/blog/blog.ts:130 | Chưa rõ | Không tìm thấy |
| deleteBlogCategory | DELETE | /blog/categories/${id} | bỏ trống→true | src/modules/api/rest/blog/blog.ts:137 | Chưa rõ | Không tìm thấy |
| getBlogComments | GET | /blog/posts/${postId}/comments | bỏ trống→true | src/modules/api/rest/blog/blog.ts:151 | Không (bị chặn) | Không tìm thấy |
| createBlogComment | POST | /blog/posts/${postId}/comments | bỏ trống→true | src/modules/api/rest/blog/blog.ts:161 | Không (bị chặn) | Không tìm thấy |
| updateBlogComment | PUT | /blog/comments/${id} | bỏ trống→true | src/modules/api/rest/blog/blog.ts:171 | Không (bị chặn) | Không tìm thấy |
| deleteBlogComment | DELETE | /blog/comments/${id} | bỏ trống→true | src/modules/api/rest/blog/blog.ts:178 | Không (bị chặn) | Không tìm thấy |
| reactToBlogPost | PUT | /blog/posts/${id}/reaction | bỏ trống→true | src/modules/api/rest/blog/blog.ts:184 | Không (bị chặn) | Không tìm thấy |
| reactToBlogComment | PUT | /blog/comments/${id}/reaction | bỏ trống→true | src/modules/api/rest/blog/blog.ts:192 | Không (bị chặn) | Không tìm thấy |
| getCareerRoadmaps | GET | /career/roadmaps | true | src/modules/api/rest/career/career.ts:38 | Không (bị chặn) | /career/page.tsx, /subjects/[subjectId]/career/... |
| getCareerRoadmapDetail | GET | /career/roadmaps/${slug} | true | src/modules/api/rest/career/career.ts:50 | Không (bị chặn) | /subjects/[subjectId]/career/page.tsx |
| createCareerRoadmap | POST | /career/roadmaps | bỏ trống→true | src/modules/api/rest/career/career.ts:59 | Chưa rõ | Không tìm thấy |
| patchCareerRoadmap | PATCH | /career/roadmaps/${slug} | bỏ trống→true | src/modules/api/rest/career/career.ts:69 | Chưa rõ | Không tìm thấy |
| enrollCareerRoadmap | POST | /career/roadmaps/${slug}/enroll | bỏ trống→true | src/modules/api/rest/career/career.ts:78 | Không (bị chặn) | /subjects/[subjectId]/career/page.tsx |
| getMyCareerRoadmaps | GET | /career/me/roadmaps | true | src/modules/api/rest/career/career.ts:84 | Không (bị chặn) | /subjects/[subjectId]/career/page.tsx |
| getCareerOpportunities | GET | /career/opportunities | true | src/modules/api/rest/career/career.ts:97 | Không (bị chặn) | /career/page.tsx, /subjects/[subjectId]/career/... |
| createCareerOpportunity | POST | /career/opportunities | bỏ trống→true | src/modules/api/rest/career/career.ts:107 | Chưa rõ | Không tìm thấy |
| patchCareerOpportunity | PATCH | /career/opportunities/${id} | bỏ trống→true | src/modules/api/rest/career/career.ts:117 | Chưa rõ | Không tìm thấy |
| applyCareerOpportunity | POST | /career/opportunities/${id}/apply | bỏ trống→true | src/modules/api/rest/career/career.ts:127 | Không (bị chặn) | /career/page.tsx, /subjects/[subjectId]/career/... |
| getMyCareerApplications | GET | /career/me/applications | true | src/modules/api/rest/career/career.ts:136 | Không (bị chặn) | /subjects/[subjectId]/career/page.tsx |
| getCareerApplication | GET | /career/applications/${id} | true | src/modules/api/rest/career/career.ts:145 | Chưa rõ | Không tìm thấy |
| patchCareerApplicationStatus | PATCH | /career/applications/${id}/status | bỏ trống→true | src/modules/api/rest/career/career.ts:155 | Chưa rõ | Không tìm thấy |
| withdrawCareerApplication | POST | /career/applications/${id}/withdraw | bỏ trống→true | src/modules/api/rest/career/career.ts:164 | Chưa rõ | Không tìm thấy |
| requestCareerMentor | POST | /career/mentors/${mentorId}/request | bỏ trống→true | src/modules/api/rest/career/career.ts:175 | Chưa rõ | Không tìm thấy |
| patchCareerMentorship | PATCH | /career/mentorships/${id} | bỏ trống→true | src/modules/api/rest/career/career.ts:185 | Chưa rõ | Không tìm thấy |
| getMyCareerRecommendations | GET | /career/me/recommendations | true | src/modules/api/rest/career/career.ts:196 | Không (bị chặn) | /subjects/[subjectId]/career/page.tsx |
| getCareerSkills | GET | /career/skills | true | src/modules/api/rest/career/career.ts:209 | Không (bị chặn) | /career/page.tsx, /subjects/[subjectId]/career/... |
| createCareerSkill | POST | /career/skills | bỏ trống→true | src/modules/api/rest/career/career.ts:219 | Chưa rõ | Không tìm thấy |
| patchCareerSkill | PATCH | /career/skills/${slug} | bỏ trống→true | src/modules/api/rest/career/career.ts:229 | Chưa rõ | Không tìm thấy |
| getMyCareerSkills | GET | /career/me/skills | true | src/modules/api/rest/career/career.ts:236 | Không (bị chặn) | /career/page.tsx, /subjects/[subjectId]/career/... |
| submitCareerSelfAssessment | POST | /career/me/skills/${slug}/assessments | bỏ trống→true | src/modules/api/rest/career/career.ts:246 | Chưa rõ | Không tìm thấy |
| submitCareerMentorAssessment | POST | /career/skills/${slug}/assessments/${userId} | bỏ trống→true | src/modules/api/rest/career/career.ts:257 | Chưa rõ | Không tìm thấy |
| getCareerSkillSubjects | GET | /career/skills/${slug}/subjects | true | src/modules/api/rest/career/career.ts:289 | Chưa rõ | Không tìm thấy |
| mapCareerSkillToSubject | POST | /career/skills/${slug}/subjects/${subjectId} | bỏ trống→true | src/modules/api/rest/career/career.ts:307 | Chưa rõ | Không tìm thấy |
| unmapCareerSkillFromSubject | DELETE | /career/skills/${slug}/subjects/${subjectId} | bỏ trống→true | src/modules/api/rest/career/career.ts:322 | Chưa rõ | Không tìm thấy |
| getMyCv | GET | /career/cv/me | true | src/modules/api/rest/career/career.ts:337 | Chưa rõ | Không tìm thấy |
| putMyCv | PUT | /career/cv/me | bỏ trống→true | src/modules/api/rest/career/career.ts:350 | Chưa rõ | Không tìm thấy |
| getCv | GET | /career/cv/${id} | true | src/modules/api/rest/career/career.ts:363 | Chưa rõ | Không tìm thấy |
| listChallenges | GET | /challenges | true | src/modules/api/rest/challenges/challenges.ts:78 | Không (bị chặn) | /courses/[courseId]/learn/content/modules/[modu... |
| createChallenge | POST | /challenges | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:98 | Chưa rõ | Không tìm thấy |
| publishChallenge | POST | /challenges/${id}/publish | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:111 | Chưa rõ | Không tìm thấy |
| closeChallenge | POST | /challenges/${id}/close | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:123 | Chưa rõ | Không tìm thấy |
| updateChallengeTestCases | PUT | /challenges/${id}/test-cases | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:138 | Chưa rõ | Không tìm thấy |
| updateChallengeRubrics | PUT | /challenges/${id}/rubrics | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:154 | Chưa rõ | Không tìm thấy |
| getChallengeBySlug | GET | /challenges/${slug} | true | src/modules/api/rest/challenges/challenges.ts:167 | Không (bị chặn) | /courses/[courseId]/learn/content/modules/[modu... |
| createChallengeTeam | POST | /challenges/${id}/teams | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:184 | Chưa rõ | Không tìm thấy |
| joinChallengeTeam | POST | /challenges/${id}/teams/${teamId}/join | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:200 | Chưa rõ | Không tìm thấy |
| view | POST | /challenges/${id}/submissions | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:215 | Không (bị chặn) | /courses/[courseId]/lessons/[lessonId]/page.tsx... |
| view | POST | /challenges/${id}/submissions/file | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:251 | Không (bị chặn) | /courses/[courseId]/lessons/[lessonId]/page.tsx... |
| views | GET | /challenges/${id}/submissions/me | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:269 | Không (bị chặn) | /courses/category/[slug]/page.tsx, /courses/pag... |
| view | GET | /challenges/${id}/submissions/${submissionId}/results | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:285 | Không (bị chặn) | /courses/[courseId]/lessons/[lessonId]/page.tsx... |
| getSubmissionProjectTree | GET | /challenges/${id}/submissions/${submissionId}/project/tree | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:308 | Chưa rõ | Không tìm thấy |
| getSubmissionProjectFile | GET | /challenges/${id}/submissions/${submissionId}/project/file | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:332 | Chưa rõ | Không tìm thấy |
| applyChallengeManualScores | POST | /challenges/${id}/submissions/${submissionId}/manual-scores | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:349 | Chưa rõ | Không tìm thấy |
| getChallengeLeaderboard | GET | /challenges/${id}/leaderboard | false | src/modules/api/rest/challenges/challenges.ts:365 | Chưa rõ | Không tìm thấy |
| getChallengeComments | GET | /challenges/${id}/comments | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:393 | Không (bị chặn) | Không tìm thấy |
| postChallengeComment | POST | /challenges/${id}/comments | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:421 | Không (bị chặn) | Không tìm thấy |
| deleteChallengeComment | DELETE | /challenges/comments/${commentId} | bỏ trống→true | src/modules/api/rest/challenges/challenges.ts:442 | Không (bị chặn) | Không tìm thấy |
| createConversation | POST | /chat/conversations | bỏ trống→true | src/modules/api/rest/chat/chat.ts:19 | Chưa rõ | Không tìm thấy |
| getConversations | GET | /chat/conversations | true | src/modules/api/rest/chat/chat.ts:29 | Có | /chat/page.tsx |
| getConversation | GET | /chat/conversations/${id} | true | src/modules/api/rest/chat/chat.ts:37 | Chưa rõ | Không tìm thấy |
| addParticipant | POST | /chat/conversations/${conversationId}/participants | bỏ trống→true | src/modules/api/rest/chat/chat.ts:47 | Chưa rõ | Không tìm thấy |
| removeParticipant | DELETE | /chat/conversations/${conversationId}/participants/${userId} | bỏ trống→true | src/modules/api/rest/chat/chat.ts:57 | Chưa rõ | Không tìm thấy |
| getMessages | GET | /chat/conversations/${conversationId}/messages | true | src/modules/api/rest/chat/chat.ts:68 | Có | /layout.tsx, /chat/page.tsx |
| sendMessage | POST | /chat/conversations/${conversationId}/messages | bỏ trống→true | src/modules/api/rest/chat/chat.ts:79 | Có | /chat/page.tsx |
| markConversationRead | PUT | /chat/conversations/${conversationId}/read | bỏ trống→true | src/modules/api/rest/chat/chat.ts:89 | Chưa rõ | Không tìm thấy |
| editMessage | PATCH | /chat/messages/${messageId} | bỏ trống→true | src/modules/api/rest/chat/chat.ts:99 | Chưa rõ | Không tìm thấy |
| recallMessage | POST | /chat/messages/${messageId}/recall | bỏ trống→true | src/modules/api/rest/chat/chat.ts:106 | Chưa rõ | Không tìm thấy |
| reactToMessage | PUT | /chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)} | bỏ trống→true | src/modules/api/rest/chat/chat.ts:115 | Chưa rõ | Không tìm thấy |
| unreactToMessage | DELETE | /chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)} | bỏ trống→true | src/modules/api/rest/chat/chat.ts:124 | Chưa rõ | Không tìm thấy |
| pinMessage | PUT | /chat/conversations/${conversationId}/pins/${messageId} | bỏ trống→true | src/modules/api/rest/chat/chat.ts:135 | Chưa rõ | Không tìm thấy |
| unpinMessage | DELETE | /chat/conversations/${conversationId}/pins/${messageId} | bỏ trống→true | src/modules/api/rest/chat/chat.ts:144 | Chưa rõ | Không tìm thấy |
| getPinnedMessages | GET | /chat/conversations/${conversationId}/pins | true | src/modules/api/rest/chat/chat.ts:150 | Chưa rõ | Không tìm thấy |
| searchMessages | GET | /chat/messages/search | true | src/modules/api/rest/chat/chat.ts:162 | Chưa rõ | Không tìm thấy |
| getPresence | GET | /chat/presence | true | src/modules/api/rest/chat/chat.ts:170 | Chưa rõ | Không tìm thấy |
| getCart | GET | /commerce/cart | true | src/modules/api/rest/commerce/commerce.ts:31 | Không (bị chặn) | /cart/page.tsx, /courses/[courseId]/page.tsx |
| addCartItem | POST | /commerce/cart/items | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:46 | Không (bị chặn) | /courses/[courseId]/page.tsx, /marketplace/page... |
| removeCartItem | DELETE | /commerce/cart/items/${id} | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:59 | Không (bị chặn) | /cart/page.tsx, /courses/[courseId]/page.tsx |
| checkout | POST | /commerce/checkout | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:75 | Không (bị chặn) | /cart/page.tsx, /courses/[courseId]/page.tsx, /... |
| getMyOrders | GET | /commerce/orders/me | true | src/modules/api/rest/commerce/commerce.ts:91 | Chưa rõ | Không tìm thấy |
| getOrder | GET | /commerce/orders/${orderId} | true | src/modules/api/rest/commerce/commerce.ts:108 | Chưa rõ | Không tìm thấy |
| cancelOrder | POST | /commerce/orders/${orderId}/cancel | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:121 | Chưa rõ | Không tìm thấy |
| validateCoupon | POST | /commerce/coupons/validate | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:135 | Chưa rõ | Không tìm thấy |
| getInvoice | GET | /commerce/orders/${orderId}/invoice | true | src/modules/api/rest/commerce/commerce.ts:148 | Chưa rõ | Không tìm thấy |
| requestRefund | POST | /commerce/orders/${orderId}/refund-requests | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:164 | Chưa rõ | Không tìm thấy |
| listProducts | GET | /commerce/products | false | src/modules/api/rest/commerce/commerce.ts:183 | Có | /cart/page.tsx, /marketplace/page.tsx |
| getProductBySlug | GET | /commerce/products/${slug} | false | src/modules/api/rest/commerce/commerce.ts:201 | Chưa rõ | Không tìm thấy |
| res | GET | /commerce/products/for-course/${courseId} | false | src/modules/api/rest/commerce/commerce.ts:231 | Chưa rõ | Không tìm thấy |
| createProduct | POST | /commerce/admin/products | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:274 | Chưa rõ | Không tìm thấy |
| updateProduct | PUT | /commerce/admin/products/${id} | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:290 | Chưa rõ | Không tìm thấy |
| archiveProduct | DELETE | /commerce/admin/products/${id} | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:303 | Chưa rõ | Không tìm thấy |
| getRefundQueue | GET | /commerce/admin/refund-requests | true | src/modules/api/rest/commerce/commerce.ts:320 | Chưa rõ | Không tìm thấy |
| approveRefundRequest | POST | /commerce/admin/refund-requests/${id}/approve | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:339 | Chưa rõ | Không tìm thấy |
| rejectRefundRequest | POST | /commerce/admin/refund-requests/${id}/reject | bỏ trống→true | src/modules/api/rest/commerce/commerce.ts:354 | Chưa rõ | Không tìm thấy |
| getReconciliationRuns | GET | /commerce/admin/reconciliation/runs | true | src/modules/api/rest/commerce/commerce.ts:370 | Chưa rõ | Không tìm thấy |
| createPost | POST | /community/posts | bỏ trống→true | src/modules/api/rest/community/community.ts:33 | Không (bị chặn) | /subjects/[subjectId]/discussion/page.tsx |
| uploadCommunityMedia | POST | /community/media | bỏ trống→true | src/modules/api/rest/community/community.ts:55 | Chưa rõ | Không tìm thấy |
| addComment | POST | /community/posts/${postId}/comments | bỏ trống→true | src/modules/api/rest/community/community.ts:74 | Không (bị chặn) | /groups/[groupId]/page.tsx, /subjects/[subjectI... |
| getPostComments | GET | /community/posts/${postId}/comments | true | src/modules/api/rest/community/community.ts:92 | Chưa rõ | Không tìm thấy |
| updateComment | PATCH | /community/comments/${commentId} | bỏ trống→true | src/modules/api/rest/community/community.ts:110 | Không (bị chặn) | Không tìm thấy |
| deleteComment | DELETE | /community/comments/${commentId} | bỏ trống→true | src/modules/api/rest/community/community.ts:124 | Không (bị chặn) | Không tìm thấy |
| getPost | GET | /community/posts/${id} | true | src/modules/api/rest/community/community.ts:136 | Không (bị chặn) | /blog/[slug]/page.tsx |
| updatePost | PATCH | /community/posts/${id} | bỏ trống→true | src/modules/api/rest/community/community.ts:152 | Không (bị chặn) | Không tìm thấy |
| deletePost | DELETE | /community/posts/${id} | bỏ trống→true | src/modules/api/rest/community/community.ts:165 | Không (bị chặn) | Không tìm thấy |
| getPoll | GET | /community/posts/${postId}/poll | true | src/modules/api/rest/community/community.ts:179 | Không (bị chặn) | /community/poll/page.tsx |
| votePoll | POST | /community/posts/${id}/poll-votes | bỏ trống→true | src/modules/api/rest/community/community.ts:195 | Không (bị chặn) | /community/poll/page.tsx |
| acceptAnswer | POST | /community/posts/${postId}/accepted-answer | bỏ trống→true | src/modules/api/rest/community/community.ts:211 | Không (bị chặn) | Không tìm thấy |
| getTrending | GET | /community/trending | true | src/modules/api/rest/community/community.ts:227 | Không (bị chặn) | Không tìm thấy |
| getCampuses | GET | /community/campuses | true | src/modules/api/rest/community/community.ts:247 | Không (bị chặn) | /profile/edit/page.tsx |
| reactToPost | PUT | /community/reactions | bỏ trống→true | src/modules/api/rest/community/community.ts:267 | Không (bị chặn) | /groups/[groupId]/page.tsx, /subjects/[subjectI... |
| unreactPost | DELETE | /community/reactions | bỏ trống→true | src/modules/api/rest/community/community.ts:284 | Không (bị chặn) | /groups/[groupId]/page.tsx, /subjects/[subjectI... |
| vote | PUT | /community/votes | bỏ trống→true | src/modules/api/rest/community/community.ts:297 | Không (bị chặn) | /community/poll/page.tsx |
| sharePost | POST | /community/posts/${id}/shares | bỏ trống→true | src/modules/api/rest/community/community.ts:313 | Không (bị chặn) | Không tìm thấy |
| bookmarkPost | PUT | /community/bookmarks/${postId} | bỏ trống→true | src/modules/api/rest/community/community.ts:326 | Không (bị chặn) | Không tìm thấy |
| unbookmarkPost | DELETE | /community/bookmarks/${postId} | bỏ trống→true | src/modules/api/rest/community/community.ts:338 | Không (bị chặn) | /community/saved/page.tsx, /saved/page.tsx |
| getBookmarks | GET | /community/bookmarks | true | src/modules/api/rest/community/community.ts:350 | Chưa rõ | Không tìm thấy |
| getBookmarkedPosts | GET | /community/bookmarks/posts | true | src/modules/api/rest/community/community.ts:368 | Không (bị chặn) | /community/saved/page.tsx, /saved/page.tsx |
| followUser | PUT | /community/follows/${userId} | bỏ trống→true | src/modules/api/rest/community/community.ts:383 | Không (bị chặn) | Không tìm thấy |
| unfollowUser | DELETE | /community/follows/${userId} | bỏ trống→true | src/modules/api/rest/community/community.ts:395 | Không (bị chặn) | Không tìm thấy |
| getFollowedUserIds | GET | /community/follows/me | bỏ trống→true | src/modules/api/rest/community/community.ts:426 | Không (bị chặn) | Không tìm thấy |
| getContributorScore | GET | /community/users/${userId}/contributor-score | true | src/modules/api/rest/community/community.ts:441 | Chưa rõ | Không tìm thấy |
| getLeaderboard | GET | /community/leaderboard | true | src/modules/api/rest/community/community.ts:458 | Không (bị chặn) | /community/reputation/page.tsx |
| report | POST | /community/reports | bỏ trống→true | src/modules/api/rest/community/community.ts:477 | Không (bị chặn) | /community/moderation/page.tsx, /groups/[groupI... |
| escalateReport | POST | /community/reports/${id}/escalate | bỏ trống→true | src/modules/api/rest/community/community.ts:490 | Chưa rõ | Không tìm thấy |
| getModerationQueue | GET | /community/moderation/queue | true | src/modules/api/rest/community/community.ts:505 | Có | /community/moderation/page.tsx |
| decideModeration | POST | /community/moderation/queue/${id}/decision | bỏ trống→true | src/modules/api/rest/community/community.ts:525 | Có | /community/moderation/page.tsx |
| getCourses | GET | /courses | false | src/modules/api/rest/course/course.ts:70 | Không (bị chặn) | /courses/category/[slug]/page.tsx, /courses/pag... |
| getCourseCategories | GET | /courses/categories | false | src/modules/api/rest/course/course.ts:108 | Có | /courses/category/[slug]/page.tsx, /courses/pag... |
| getTeachingCourses | GET | /courses/teaching | true | src/modules/api/rest/course/course.ts:128 | Có | /courses/teaching/page.tsx |
| getCourseDetail | GET | /courses/${slugName} | bỏ trống→true | src/modules/api/rest/course/course.ts:154 | Không (bị chặn) | /courses/[courseId]/page.tsx, /courses/[courseI... |
| createCourse | POST | /courses | bỏ trống→true | src/modules/api/rest/course/course.ts:170 | Chưa rõ | Không tìm thấy |
| updateCourse | PATCH | /courses/${id} | bỏ trống→true | src/modules/api/rest/course/course.ts:186 | Chưa rõ | Không tìm thấy |
| publishCourse | POST | /courses/${id}/publish | bỏ trống→true | src/modules/api/rest/course/course.ts:199 | Chưa rõ | Không tìm thấy |
| archiveCourse | POST | /courses/${id}/archive | bỏ trống→true | src/modules/api/rest/course/course.ts:211 | Chưa rõ | Không tìm thấy |
| createCourseSection | POST | /courses/${id}/sections | bỏ trống→true | src/modules/api/rest/course/course.ts:226 | Chưa rõ | Không tìm thấy |
| updateCourseSection | PATCH | /courses/sections/${sectionId} | bỏ trống→true | src/modules/api/rest/course/course.ts:242 | Chưa rõ | Không tìm thấy |
| deleteCourseSection | DELETE | /courses/sections/${sectionId} | bỏ trống→true | src/modules/api/rest/course/course.ts:255 | Chưa rõ | Không tìm thấy |
| reorderCourseSections | POST | /courses/${id}/sections/reorder | bỏ trống→true | src/modules/api/rest/course/course.ts:270 | Chưa rõ | Không tìm thấy |
| createCourseLesson | POST | /courses/sections/${sectionId}/lessons | bỏ trống→true | src/modules/api/rest/course/course.ts:286 | Chưa rõ | Không tìm thấy |
| updateCourseLesson | PATCH | /courses/lessons/${lessonId} | bỏ trống→true | src/modules/api/rest/course/course.ts:302 | Chưa rõ | Không tìm thấy |
| deleteCourseLesson | DELETE | /courses/lessons/${lessonId} | bỏ trống→true | src/modules/api/rest/course/course.ts:315 | Chưa rõ | Không tìm thấy |
| requestCourseVideoUploadUrl | POST | /courses/lessons/${lessonId}/video/upload-url | bỏ trống→true | src/modules/api/rest/course/course.ts:330 | Chưa rõ | Không tìm thấy |
| completeCourseVideoUpload | POST | /courses/videos/${videoId}/complete-upload | bỏ trống→true | src/modules/api/rest/course/course.ts:345 | Chưa rõ | Không tìm thấy |
| getLessonStreamUrl | GET | /courses/lessons/${lessonId}/stream | true | src/modules/api/rest/course/course.ts:357 | Chưa rõ | Không tìm thấy |
| getLessonDocuments | GET | /lessons/${lessonId}/documents | true | src/modules/api/rest/course/course.ts:370 | Có | /courses/[courseId]/learn/layout.tsx |
| getLessonFlashcards | GET | /courses/lessons/${lessonId}/flashcards | true | src/modules/api/rest/course/course.ts:384 | Chưa rõ | Không tìm thấy |
| createLessonFlashcard | POST | /courses/lessons/${lessonId}/flashcards | true | src/modules/api/rest/course/course.ts:400 | Chưa rõ | Không tìm thấy |
| createLessonFlashcardsBulk | POST | /courses/lessons/${lessonId}/flashcards/bulk | true | src/modules/api/rest/course/course.ts:421 | Chưa rõ | Không tìm thấy |
| updateLessonFlashcard | PATCH | /courses/flashcards/${cardId} | true | src/modules/api/rest/course/course.ts:438 | Chưa rõ | Không tìm thấy |
| deleteLessonFlashcard | DELETE | /courses/flashcards/${cardId} | true | src/modules/api/rest/course/course.ts:452 | Chưa rõ | Không tìm thấy |
| getMyEnrollments | GET | /courses/me/enrollments | true | src/modules/api/rest/course/course.ts:467 | Không (bị chặn) | /courses/me/page.tsx, /ai/page.tsx, /courses/[c... |
| getMyCourseAccess | GET | /courses/${courseId}/me/access | true | src/modules/api/rest/course/course.ts:487 | Có | /courses/[courseId]/learn/content/modules/[modu... |
| enrollCourseDirect | POST | /courses/${id}/enroll | bỏ trống→true | src/modules/api/rest/course/course.ts:500 | Không (bị chặn) | /courses/[courseId]/page.tsx |
| getCoursePackages | GET | /courses/${id}/packages | false | src/modules/api/rest/course/course.ts:514 | Không (bị chặn) | /courses/[courseId]/page.tsx, /courses/[courseI... |
| createCoursePackage | POST | /courses/${id}/packages | bỏ trống→true | src/modules/api/rest/course/course.ts:530 | Chưa rõ | Không tìm thấy |
| getCourseProgress | GET | /courses/${courseId}/me/progress | true | src/modules/api/rest/course/course.ts:548 | Có | /courses/[courseId]/progress/page.tsx, /courses... |
| reportLessonProgress | PUT | /courses/lessons/${lessonId}/progress | bỏ trống→true | src/modules/api/rest/course/course.ts:564 | Có | /courses/[courseId]/learn/content/modules/[modu... |
| markLessonComplete | POST | /courses/lessons/${lessonId}/complete | bỏ trống→true | src/modules/api/rest/course/course.ts:579 | Có | /courses/[courseId]/learn/content/modules/[modu... |
| addLessonBookmark | POST | /courses/lessons/${lessonId}/bookmarks | bỏ trống→true | src/modules/api/rest/course/course.ts:594 | Chưa rõ | Không tìm thấy |
| deleteLessonBookmark | DELETE | /courses/lessons/${lessonId}/bookmarks/${bookmarkId} | bỏ trống→true | src/modules/api/rest/course/course.ts:610 | Chưa rõ | Không tìm thấy |
| addLessonNote | POST | /courses/lessons/${lessonId}/notes | bỏ trống→true | src/modules/api/rest/course/course.ts:625 | Chưa rõ | Không tìm thấy |
| updateLessonNote | PATCH | /courses/lessons/${lessonId}/notes/${noteId} | bỏ trống→true | src/modules/api/rest/course/course.ts:642 | Chưa rõ | Không tìm thấy |
| deleteLessonNote | DELETE | /courses/lessons/${lessonId}/notes/${noteId} | bỏ trống→true | src/modules/api/rest/course/course.ts:658 | Chưa rõ | Không tìm thấy |
| readLessonContent | GET | /lessons/${lessonId}/content | bỏ trống→true | src/modules/api/rest/course/course.ts:674 | Có | /courses/[courseId]/learn/content/modules/[modu... |
| upsertLessonContent | PUT | /lessons/${lessonId}/content | bỏ trống→true | src/modules/api/rest/course/course.ts:689 | Chưa rõ | Không tìm thấy |
| updateLessonPreview | PATCH | /lessons/${lessonId}/preview | bỏ trống→true | src/modules/api/rest/course/course.ts:705 | Chưa rõ | Không tìm thấy |
| updateCoursePreviewDefault | PATCH | /courses/${courseId}/preview-default | bỏ trống→true | src/modules/api/rest/course/course.ts:721 | Chưa rõ | Không tìm thấy |
| updateLessonAiChatLimit | PATCH | /lessons/${lessonId}/ai-chat-limit | bỏ trống→true | src/modules/api/rest/course/course.ts:737 | Chưa rõ | Không tìm thấy |
| reportPreviewLimit | POST | /lessons/${lessonId}/preview-limit | bỏ trống→true | src/modules/api/rest/course/course.ts:753 | Chưa rõ | Không tìm thấy |
| getLessonQuizzes | GET | /courses/lessons/${lessonId}/quizzes | bỏ trống→true | src/modules/api/rest/course/course.ts:772 | Chưa rõ | Không tìm thấy |
| getMyQuizAttempts | GET | /courses/quizzes/${quizId}/attempts/me | bỏ trống→true | src/modules/api/rest/course/course.ts:786 | Chưa rõ | Không tìm thấy |
| createLessonQuiz | POST | /courses/lessons/${lessonId}/quizzes | bỏ trống→true | src/modules/api/rest/course/course.ts:801 | Chưa rõ | Không tìm thấy |
| addQuizQuestion | POST | /courses/quizzes/${quizId}/questions | bỏ trống→true | src/modules/api/rest/course/course.ts:817 | Chưa rõ | Không tìm thấy |
| publishQuiz | POST | /courses/quizzes/${quizId}/publish | bỏ trống→true | src/modules/api/rest/course/course.ts:830 | Chưa rõ | Không tìm thấy |
| startQuizAttempt | POST | /courses/quizzes/${quizId}/attempts | bỏ trống→true | src/modules/api/rest/course/course.ts:844 | Chưa rõ | Không tìm thấy |
| submitQuizAttempt | PUT | /courses/quiz-attempts/${attemptId}/submit | bỏ trống→true | src/modules/api/rest/course/course.ts:859 | Chưa rõ | Không tìm thấy |
| verifyCertificate | GET | /courses/certificates/verify/${code} | false | src/modules/api/rest/course/course.ts:876 | Có | /certificates/verify/[code]/page.tsx |
| getMyCertificates | GET | /courses/me/certificates | bỏ trống→true | src/modules/api/rest/course/course.ts:889 | Không (bị chặn) | /courses/[courseId]/progress/page.tsx, /profile... |
| revokeCertificate | POST | /courses/certificates/${id}/revoke | bỏ trống→true | src/modules/api/rest/course/course.ts:901 | Chưa rõ | Không tìm thấy |
| getCourseRatings | GET | /courses/${courseId}/ratings | false | src/modules/api/rest/course/course.ts:919 | Không (bị chặn) | Không tìm thấy |
| getMyCourseRating | GET | /courses/${courseId}/ratings/me | true | src/modules/api/rest/course/course.ts:939 | Không (bị chặn) | Không tìm thấy |
| rateCourse | POST | /courses/${courseId}/ratings | bỏ trống→true | src/modules/api/rest/course/course.ts:956 | Không (bị chặn) | Không tìm thấy |
| deleteCourseRating | DELETE | /courses/${courseId}/ratings | bỏ trống→true | src/modules/api/rest/course/course.ts:969 | Không (bị chặn) | Không tìm thấy |
| getLessonComments | GET | /courses/lessons/${lessonId}/comments | true | src/modules/api/rest/course/course.ts:987 | Chưa rõ | Không tìm thấy |
| postLessonComment | POST | /courses/lessons/${lessonId}/comments | bỏ trống→true | src/modules/api/rest/course/course.ts:1008 | Có | /courses/[courseId]/learn/qa/page.tsx |
| deleteLessonComment | DELETE | /courses/comments/${commentId} | bỏ trống→true | src/modules/api/rest/course/course.ts:1022 | Chưa rõ | Không tìm thấy |
| reactLessonComment | POST | /courses/comments/${commentId}/reactions/${emoji} | bỏ trống→true | src/modules/api/rest/course/course.ts:1037 | Chưa rõ | Không tìm thấy |
| unreactLessonComment | DELETE | /courses/comments/${commentId}/reactions/${emoji} | bỏ trống→true | src/modules/api/rest/course/course.ts:1052 | Chưa rõ | Không tìm thấy |
| getLessonReactions | GET | /courses/lessons/${lessonId}/reactions | bỏ trống→true | src/modules/api/rest/course/course.ts:1070 | Chưa rõ | Không tìm thấy |
| putLessonReaction | PUT | /courses/lessons/${lessonId}/reactions/${reaction} | bỏ trống→true | src/modules/api/rest/course/course.ts:1086 | Chưa rõ | Không tìm thấy |
| deleteLessonReaction | DELETE | /courses/lessons/${lessonId}/reactions/${reaction} | bỏ trống→true | src/modules/api/rest/course/course.ts:1101 | Chưa rõ | Không tìm thấy |
| getMyLearnedLessons | GET | /courses/me/learned-lessons | true | src/modules/api/rest/course/course.ts:1114 | Không (bị chặn) | Không tìm thấy |
| getEvents | GET | /events | bỏ trống→true | src/modules/api/rest/event/event.ts:23 | Không (bị chặn) | /events/[slug]/page.tsx, /events/page.tsx |
| getEventDetail | GET | /event/events/${slug} | bỏ trống→true | src/modules/api/rest/event/event.ts:29 | Có | /events/[slug]/page.tsx |
| registerEvent | POST | /event/events/${id}/registrations | bỏ trống→true | src/modules/api/rest/event/event.ts:35 | Không (bị chặn) | /events/[slug]/page.tsx, /events/page.tsx |
| cancelEventRegistration | DELETE | /event/events/${id}/registrations/me | bỏ trống→true | src/modules/api/rest/event/event.ts:41 | Không (bị chặn) | /events/[slug]/page.tsx, /events/page.tsx |
| getMyEventRegistrations | GET | /event/registrations/me | true | src/modules/api/rest/event/event.ts:47 | Không (bị chặn) | Không tìm thấy |
| getEventRegistrationQr | GET | /event/registrations/${id}/qr | true | src/modules/api/rest/event/event.ts:54 | Chưa rõ | Không tìm thấy |
| scanEventCheckin | POST | /event/checkins/scan | bỏ trống→true | src/modules/api/rest/event/event.ts:61 | Chưa rõ | Không tìm thấy |
| getMyEventCertificates | GET | /event/certificates/me | true | src/modules/api/rest/event/event.ts:68 | Chưa rõ | Không tìm thấy |
| verifyEventCertificate | GET | /event/certificates/verify/${verifyCode} | bỏ trống→true | src/modules/api/rest/event/event.ts:77 | Chưa rõ | Không tìm thấy |
| createEvent | POST | /event/admin/events | bỏ trống→true | src/modules/api/rest/event/event.ts:85 | Chưa rõ | Không tìm thấy |
| submitEvent | POST | /event/admin/events/${id}/submit | bỏ trống→true | src/modules/api/rest/event/event.ts:92 | Chưa rõ | Không tìm thấy |
| cancelEvent | POST | /event/admin/events/${id}/cancel | bỏ trống→true | src/modules/api/rest/event/event.ts:98 | Chưa rõ | Không tìm thấy |
| setEventRecording | POST | /event/admin/events/${id}/recording | bỏ trống→true | src/modules/api/rest/event/event.ts:107 | Chưa rõ | Không tìm thấy |
| manualCheckinEvent | POST | /event/admin/events/${id}/checkins/manual | bỏ trống→true | src/modules/api/rest/event/event.ts:117 | Chưa rõ | Không tìm thấy |
| getEventAttendance | GET | /event/admin/events/${id}/attendance | true | src/modules/api/rest/event/event.ts:124 | Chưa rõ | Không tìm thấy |
| getMyXpHistory | GET | /gamification/me/xp-history | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:39 | Chưa rõ | Không tìm thấy |
| getMyStreak | GET | /gamification/me/streak | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:55 | Không (bị chặn) | /analytics/page.tsx |
| getMyQuests | GET | /gamification/me/quests | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:68 | Không (bị chặn) | /quests/page.tsx, /analytics/page.tsx |
| getMyActivityDays | GET | /gamification/me/activity-days | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:83 | Không (bị chặn) | Không tìm thấy |
| getMyProgression | GET | /gamification/me/progression | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:98 | Không (bị chặn) | /quests/page.tsx |
| useStreakFreeze | POST | /gamification/me/streak/freeze | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:110 | Chưa rõ | Không tìm thấy |
| getMyGoals | GET | /gamification/me/goals | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:122 | Không (bị chặn) | Không tìm thấy |
| putGoal | PUT | /gamification/me/goals | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:134 | Chưa rõ | Không tìm thấy |
| getMyBadges | GET | /gamification/me/badges | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:147 | Không (bị chặn) | Không tìm thấy |
| getUserGamificationSummary | GET | /gamification/users/${userId}/summary | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:161 | Chưa rõ | Không tìm thấy |
| getGamificationLeaderboard | GET | /gamification/leaderboard | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:177 | Chưa rõ | Không tìm thấy |
| claimRewardPool | POST | /gamification/rewards/pools/${code}/claim | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:197 | Chưa rõ | Không tìm thấy |
| getMyMastery | GET | /gamification/me/mastery | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:210 | Chưa rõ | Không tìm thấy |
| getMyMasteryForSubject | GET | /gamification/me/mastery/${subjectId} | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:224 | Chưa rõ | Không tìm thấy |
| listXpRules | GET | /gamification/admin/xp-rules | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:238 | Chưa rõ | Không tìm thấy |
| upsertXpRule | POST | /gamification/admin/xp-rules | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:252 | Chưa rõ | Không tìm thấy |
| listSeasons | GET | /gamification/admin/seasons | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:265 | Chưa rõ | Không tìm thấy |
| createSeason | POST | /gamification/admin/seasons | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:279 | Chưa rõ | Không tìm thấy |
| closeSeason | POST | /gamification/admin/seasons/${id}/close | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:292 | Chưa rõ | Không tìm thấy |
| listRewardPools | GET | /gamification/admin/reward-pools | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:304 | Chưa rõ | Không tìm thấy |
| upsertRewardPool | POST | /gamification/admin/reward-pools | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:318 | Chưa rõ | Không tìm thấy |
| listRewardPoolItems | GET | /gamification/admin/reward-pools/${poolId}/items | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:333 | Chưa rõ | Không tìm thấy |
| addRewardPoolItem | POST | /gamification/admin/reward-pools/${poolId}/items | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:348 | Chưa rõ | Không tìm thấy |
| deleteRewardPoolItem | DELETE | /gamification/admin/reward-pools/items/${itemId} | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:361 | Chưa rõ | Không tìm thấy |
| validateRewardPool | GET | /gamification/admin/reward-pools/${poolId}/validate | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:373 | Chưa rõ | Không tìm thấy |
| adjustXp | POST | /gamification/admin/xp-adjust | bỏ trống→true | src/modules/api/rest/gamification/gamification.ts:387 | Chưa rõ | Không tìm thấy |
| createGroup | POST | /groups | bỏ trống→true | src/modules/api/rest/group/group.ts:45 | Không (bị chặn) | Không tìm thấy |
| getGroup | GET | /groups/${idOrSlug} | true | src/modules/api/rest/group/group.ts:52 | Không (bị chặn) | /groups/[groupId]/manage/page.tsx, /groups/[gro... |
| discoverGroups | GET | /groups | true | src/modules/api/rest/group/group.ts:65 | Không (bị chặn) | /groups/page.tsx, /groups/new/page.tsx |
| getGroupFeed | GET | /groups/${id}/feed | true | src/modules/api/rest/group/group.ts:85 | Không (bị chặn) | /groups/[groupId]/page.tsx |
| updateGroup | PATCH | /groups/${id} | bỏ trống→true | src/modules/api/rest/group/group.ts:99 | Chưa rõ | Không tìm thấy |
| archiveGroup | POST | /groups/${id}/archive | bỏ trống→true | src/modules/api/rest/group/group.ts:106 | Chưa rõ | Không tìm thấy |
| joinGroup | POST | /groups/${id}/join | bỏ trống→true | src/modules/api/rest/group/group.ts:115 | Không (bị chặn) | Không tìm thấy |
| listJoinRequests | GET | /groups/${id}/join-requests | true | src/modules/api/rest/group/group.ts:128 | Không (bị chặn) | /groups/[groupId]/manage/page.tsx |
| decideJoinRequest | POST | /groups/${id}/join-requests/${reqId}/decision | bỏ trống→true | src/modules/api/rest/group/group.ts:143 | Chưa rõ | Không tìm thấy |
| inviteToGroup | POST | /groups/${id}/invitations | bỏ trống→true | src/modules/api/rest/group/group.ts:153 | Không (bị chặn) | Không tìm thấy |
| listGroupMembers | GET | /groups/${id}/members | true | src/modules/api/rest/group/group.ts:166 | Không (bị chặn) | /groups/[groupId]/events/page.tsx, /groups/[gro... |
| changeMemberRole | PATCH | /groups/${id}/members/${userId} | bỏ trống→true | src/modules/api/rest/group/group.ts:181 | Không (bị chặn) | /groups/[groupId]/members/page.tsx |
| removeMember | DELETE | /groups/${id}/members/${userId} | bỏ trống→true | src/modules/api/rest/group/group.ts:188 | Không (bị chặn) | /groups/[groupId]/members/page.tsx |
| transferOwnership | POST | /groups/${id}/transfer-ownership | bỏ trống→true | src/modules/api/rest/group/group.ts:197 | Chưa rõ | Không tìm thấy |
| createAnnouncement | POST | /groups/${id}/announcements | bỏ trống→true | src/modules/api/rest/group/group.ts:207 | Không (bị chặn) | /groups/[groupId]/announcements/page.tsx |
| updateAnnouncement | PATCH | /groups/${id}/announcements/${announcementId} | bỏ trống→true | src/modules/api/rest/group/group.ts:218 | Không (bị chặn) | /groups/[groupId]/announcements/page.tsx |
| deleteAnnouncement | DELETE | /groups/${id}/announcements/${announcementId} | bỏ trống→true | src/modules/api/rest/group/group.ts:228 | Không (bị chặn) | /groups/[groupId]/announcements/page.tsx |
| listAnnouncements | GET | /groups/${id}/announcements | true | src/modules/api/rest/group/group.ts:239 | Không (bị chặn) | /groups/[groupId]/announcements/page.tsx |
| pinPost | PUT | /groups/${id}/pinned-posts/${postId} | bỏ trống→true | src/modules/api/rest/group/group.ts:249 | Không (bị chặn) | /groups/[groupId]/manage/page.tsx, /groups/[gro... |
| unpinPost | DELETE | /groups/${id}/pinned-posts/${postId} | bỏ trống→true | src/modules/api/rest/group/group.ts:255 | Không (bị chặn) | /groups/[groupId]/manage/page.tsx, /groups/[gro... |
| listPinnedPosts | GET | /groups/${id}/pinned-posts | true | src/modules/api/rest/group/group.ts:263 | Không (bị chặn) | /groups/[groupId]/manage/page.tsx |
| linkResource | PUT | /groups/${id}/resources/${resourceId} | bỏ trống→true | src/modules/api/rest/group/group.ts:274 | Không (bị chặn) | /groups/[groupId]/resources/page.tsx |
| unlinkResource | DELETE | /groups/${id}/resources/${resourceId} | bỏ trống→true | src/modules/api/rest/group/group.ts:284 | Không (bị chặn) | /groups/[groupId]/resources/page.tsx |
| listLinkedResources | GET | /groups/${id}/resources | true | src/modules/api/rest/group/group.ts:292 | Không (bị chặn) | /groups/[groupId]/resources/page.tsx |
| listGroupEvents | GET | /groups/${id}/events | true | src/modules/api/rest/group/group.ts:306 | Không (bị chặn) | /groups/[groupId]/events/page.tsx |
| createGroupEvent | POST | /groups/${id}/events | bỏ trống→true | src/modules/api/rest/group/group.ts:323 | Không (bị chặn) | /groups/[groupId]/events/page.tsx |
| updateGroupEvent | PATCH | /groups/${id}/events/${eventId} | bỏ trống→true | src/modules/api/rest/group/group.ts:335 | Không (bị chặn) | /groups/[groupId]/events/page.tsx |
| deleteGroupEvent | DELETE | /groups/${id}/events/${eventId} | bỏ trống→true | src/modules/api/rest/group/group.ts:346 | Không (bị chặn) | /groups/[groupId]/events/page.tsx |
| getGroupChallenges | GET | /groups/${id}/challenges | true | src/modules/api/rest/group/group.ts:356 | Có | /groups/[groupId]/challenges/page.tsx |
| attendGroupEvent | POST | /groups/${id}/events/${eventId}/attend | bỏ trống→true | src/modules/api/rest/group/group.ts:369 | Không (bị chặn) | /groups/[groupId]/events/page.tsx |
| unattendGroupEvent | DELETE | /groups/${id}/events/${eventId}/attend | bỏ trống→true | src/modules/api/rest/group/group.ts:379 | Không (bị chặn) | /groups/[groupId]/events/page.tsx |
| getGroupRules | GET | /groups/${id}/rules | true | src/modules/api/rest/group/group.ts:388 | Không (bị chặn) | /groups/[groupId]/manage/page.tsx |
| updateGroupRules | PUT | /groups/${id}/rules | bỏ trống→true | src/modules/api/rest/group/group.ts:399 | Có | /groups/[groupId]/manage/page.tsx |
| presignGroupMedia | POST | /groups/${id}/media/presign | bỏ trống→true | src/modules/api/rest/group/group.ts:412 | Không (bị chặn) | Không tìm thấy |
| verifyGroupMedia | POST | /groups/${id}/media/verify | bỏ trống→true | src/modules/api/rest/group/group.ts:443 | Không (bị chặn) | Không tìm thấy |
| clearGroupMedia | DELETE | /groups/${id}/media/${kind} | bỏ trống→true | src/modules/api/rest/group/group.ts:462 | Chưa rõ | Không tìm thấy |
| listGroupThreads | GET | /groups/${id}/discussion/threads | true | src/modules/api/rest/group/group.ts:473 | Không (bị chặn) | /groups/[groupId]/discussion/page.tsx |
| createGroupThread | POST | /groups/${id}/discussion/threads | bỏ trống→true | src/modules/api/rest/group/group.ts:484 | Không (bị chặn) | /groups/[groupId]/discussion/page.tsx |
| getGroupThread | GET | /groups/${id}/discussion/threads/${threadId} | true | src/modules/api/rest/group/group.ts:494 | Chưa rõ | Không tìm thấy |
| deleteGroupThread | DELETE | /groups/${id}/discussion/threads/${threadId} | bỏ trống→true | src/modules/api/rest/group/group.ts:504 | Chưa rõ | Không tìm thấy |
| listGroupThreadComments | GET | /groups/${id}/discussion/threads/${threadId}/comments | true | src/modules/api/rest/group/group.ts:514 | Không (bị chặn) | /groups/[groupId]/discussion/page.tsx |
| createGroupThreadComment | POST | /groups/${id}/discussion/threads/${threadId}/comments | bỏ trống→true | src/modules/api/rest/group/group.ts:526 | Không (bị chặn) | /groups/[groupId]/discussion/page.tsx |
| deleteGroupThreadComment | DELETE | /groups/${id}/discussion/comments/${commentId} | bỏ trống→true | src/modules/api/rest/group/group.ts:536 | Chưa rõ | Không tìm thấy |
| likeGroupThread | PUT | /groups/${id}/discussion/threads/${threadId}/reactions | bỏ trống→true | src/modules/api/rest/group/group.ts:546 | Không (bị chặn) | /groups/[groupId]/discussion/page.tsx |
| unlikeGroupThread | DELETE | /groups/${id}/discussion/threads/${threadId}/reactions | bỏ trống→true | src/modules/api/rest/group/group.ts:555 | Không (bị chặn) | /groups/[groupId]/discussion/page.tsx |
| likeGroupThreadComment | PUT | /groups/${id}/discussion/comments/${commentId}/reactions | bỏ trống→true | src/modules/api/rest/group/group.ts:565 | Chưa rõ | Không tìm thấy |
| unlikeGroupThreadComment | DELETE | /groups/${id}/discussion/comments/${commentId}/reactions | bỏ trống→true | src/modules/api/rest/group/group.ts:574 | Chưa rõ | Không tìm thấy |
| getMyInvitations | GET | /invitations/me | bỏ trống→true | src/modules/api/rest/group/group.ts:591 | Không (bị chặn) | Không tìm thấy |
| respondToInvitation | POST | /invitations/${id}/respond | bỏ trống→true | src/modules/api/rest/group/group.ts:601 | Không (bị chặn) | Không tìm thấy |
| register | POST | /auth/register | bỏ trống→true | src/modules/api/rest/identity/identity.ts:36 | Không (bị chặn) | /authentication/register/page.tsx, /events/[slu... |
| verifyRegistration | POST | /auth/register/verify | bỏ trống→true | src/modules/api/rest/identity/identity.ts:54 | Chưa rõ | Không tìm thấy |
| verifyEmail | POST | /auth/verify-email | bỏ trống→true | src/modules/api/rest/identity/identity.ts:67 | Chưa rõ | Không tìm thấy |
| resendVerificationEmail | POST | /auth/resend-verification | bỏ trống→true | src/modules/api/rest/identity/identity.ts:82 | Chưa rõ | Không tìm thấy |
| verifyMfaChallenge | POST | /auth/mfa/verify | bỏ trống→true | src/modules/api/rest/identity/identity.ts:97 | Chưa rõ | Không tìm thấy |
| loginWithGoogle | POST | /auth/google | bỏ trống→true | src/modules/api/rest/identity/identity.ts:112 | Chưa rõ | Không tìm thấy |
| requestOtp | POST | /auth/otp/request | bỏ trống→true | src/modules/api/rest/identity/identity.ts:125 | Chưa rõ | Không tìm thấy |
| verifyOtp | POST | /auth/otp/verify | bỏ trống→true | src/modules/api/rest/identity/identity.ts:138 | Chưa rõ | Không tìm thấy |
| requestPasswordReset | POST | /auth/forgot-password | bỏ trống→true | src/modules/api/rest/identity/identity.ts:153 | Chưa rõ | Không tìm thấy |
| resetPassword | POST | /auth/reset-password | bỏ trống→true | src/modules/api/rest/identity/identity.ts:168 | Có | /authentication/reset-password/page.tsx, /authe... |
| getMfaStatus | GET | /identity/mfa | true | src/modules/api/rest/identity/identity.ts:183 | Chưa rõ | Không tìm thấy |
| enrollMfaTotp | POST | /identity/mfa/totp/enroll | bỏ trống→true | src/modules/api/rest/identity/identity.ts:196 | Chưa rõ | Không tìm thấy |
| activateMfaTotp | POST | /identity/mfa/totp/activate | bỏ trống→true | src/modules/api/rest/identity/identity.ts:210 | Chưa rõ | Không tìm thấy |
| disableMfaTotp | DELETE | /identity/mfa/totp | bỏ trống→true | src/modules/api/rest/identity/identity.ts:225 | Chưa rõ | Không tìm thấy |
| changePassword | PUT | /identity/password | bỏ trống→true | src/modules/api/rest/identity/identity.ts:242 | Chưa rõ | Không tìm thấy |
| listSessions | GET | /identity/sessions | true | src/modules/api/rest/identity/identity.ts:257 | Chưa rõ | Không tìm thấy |
| revokeSession | DELETE | /identity/sessions/${sid} | bỏ trống→true | src/modules/api/rest/identity/identity.ts:270 | Chưa rõ | Không tìm thấy |
| revokeAllSessions | DELETE | /identity/sessions | bỏ trống→true | src/modules/api/rest/identity/identity.ts:284 | Chưa rõ | Không tìm thấy |
| listRbacRoles | GET | /identity/roles | true | src/modules/api/rest/identity-rbac/identityRbac.ts:23 | Không (bị chặn) | /admin/roles/page.tsx, /admin/page.tsx |
| getRbacRole | GET | /identity/roles/${id} | true | src/modules/api/rest/identity-rbac/identityRbac.ts:30 | Không (bị chặn) | /admin/roles/page.tsx |
| createRbacRole | POST | /identity/roles | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:39 | Chưa rõ | Không tìm thấy |
| updateRbacRole | PATCH | /identity/roles/${id} | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:49 | Chưa rõ | Không tìm thấy |
| deleteRbacRole | DELETE | /identity/roles/${id} | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:58 | Chưa rõ | Không tìm thấy |
| replaceRbacRolePermissions | PUT | /identity/roles/${id}/permissions | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:67 | Chưa rõ | Không tìm thấy |
| getRbacPermissionCatalog | GET | /identity/permissions | true | src/modules/api/rest/identity-rbac/identityRbac.ts:78 | Chưa rõ | Không tìm thấy |
| listRbacUserRoleGrants | GET | /identity/users/${userId}/roles | true | src/modules/api/rest/identity-rbac/identityRbac.ts:92 | Chưa rõ | Không tìm thấy |
| grantRbacRoleToUser | POST | /identity/users/${userId}/roles | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:102 | Chưa rõ | Không tìm thấy |
| revokeRbacUserRoleGrant | DELETE | /identity/users/${userId}/roles/${grantId} | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:112 | Chưa rõ | Không tìm thấy |
| listRbacUserPermissionGrants | GET | /identity/users/${userId}/permissions | true | src/modules/api/rest/identity-rbac/identityRbac.ts:122 | Chưa rõ | Không tìm thấy |
| grantRbacPermissionToUser | POST | /identity/users/${userId}/permissions | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:132 | Chưa rõ | Không tìm thấy |
| revokeRbacUserPermissionGrant | DELETE | /identity/users/${userId}/permissions/${grantId} | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:142 | Chưa rõ | Không tìm thấy |
| getMyRbacPermissions | GET | /identity/me/permissions | true | src/modules/api/rest/identity-rbac/identityRbac.ts:150 | Không (bị chặn) | /admin/page.tsx |
| checkMyRbacPermissions | POST | /identity/permissions/check | bỏ trống→true | src/modules/api/rest/identity-rbac/identityRbac.ts:159 | Chưa rõ | Không tìm thấy |
| listSecurityDevices | GET | /identity/devices | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:18 | Chưa rõ | Không tìm thấy |
| trustSecurityDevice | POST | /identity/devices/${id}/trust | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:26 | Chưa rõ | Không tìm thấy |
| untrustSecurityDevice | DELETE | /identity/devices/${id}/trust | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:34 | Chưa rõ | Không tìm thấy |
| revokeSecurityDevice | DELETE | /identity/devices/${id} | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:42 | Chưa rõ | Không tìm thấy |
| getMyLoginHistory | GET | /identity/login-history | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:52 | Chưa rõ | Không tìm thấy |
| getMyVerificationStatus | GET | /identity/me/verification-status | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:65 | Chưa rõ | Không tìm thấy |
| listSecurityAdminUserSessions | GET | /identity/admin/users/${userId}/sessions | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:75 | Chưa rõ | Không tìm thấy |
| revokeAllSecurityAdminUserSessions | DELETE | /identity/admin/users/${userId}/sessions | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:83 | Chưa rõ | Không tìm thấy |
| revokeSecurityAdminUserSession | DELETE | /identity/admin/users/${userId}/sessions/${sid} | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:92 | Chưa rõ | Không tìm thấy |
| getSecurityAdminUserLoginHistory | GET | /identity/admin/users/${userId}/login-history | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:101 | Chưa rõ | Không tìm thấy |
| lockSecurityAdminUser | POST | /identity/admin/users/${userId}/lock | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:115 | Chưa rõ | Không tìm thấy |
| unlockSecurityAdminUser | POST | /identity/admin/users/${userId}/unlock | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:124 | Chưa rõ | Không tìm thấy |
| querySecurityAdminLog | GET | /identity/admin/security-log | bỏ trống→true | src/modules/api/rest/identity-security/identitySecurity.ts:132 | Chưa rõ | Không tìm thấy |
| listIntegrationApiKeys | GET | /integration/api-keys | true | src/modules/api/rest/integration/integration.ts:16 | Chưa rõ | Không tìm thấy |
| createIntegrationApiKey | POST | /integration/api-keys | bỏ trống→true | src/modules/api/rest/integration/integration.ts:25 | Chưa rõ | Không tìm thấy |
| revokeIntegrationApiKey | POST | /integration/api-keys/${id}/revoke | bỏ trống→true | src/modules/api/rest/integration/integration.ts:32 | Chưa rõ | Không tìm thấy |
| listIntegrationConnections | GET | /integration/connections | true | src/modules/api/rest/integration/integration.ts:43 | Chưa rõ | Không tìm thấy |
| getIntegrationConnection | GET | /integration/connections/${id} | true | src/modules/api/rest/integration/integration.ts:56 | Chưa rõ | Không tìm thấy |
| createIntegrationConnection | POST | /integration/connections | bỏ trống→true | src/modules/api/rest/integration/integration.ts:65 | Chưa rõ | Không tìm thấy |
| updateIntegrationConnection | PATCH | /integration/connections/${id} | bỏ trống→true | src/modules/api/rest/integration/integration.ts:75 | Chưa rõ | Không tìm thấy |
| keycloakLogin | POST | /auth/login | false | src/modules/api/rest/keycloak-auth/login.ts:20 | Chưa rõ | Không tìm thấy |
| keycloakLogout | POST | /auth/logout | true | src/modules/api/rest/keycloak-auth/logout.ts:14 | Không (bị chặn) | Không tìm thấy |
| keycloakRegister | POST | /auth/register | false | src/modules/api/rest/keycloak-auth/register.ts:22 | Chưa rõ | Không tìm thấy |
| message | POST | ${BASE}/messages | true | src/modules/api/rest/livechat/livechat.ts:69 | Không (bị chặn) | /profile/edit/page.tsx, /resources/collections/... |
| rows | GET | ${BASE}/recent?limit=${encodeURIComponent(String(limit))} | true | src/modules/api/rest/livechat/livechat.ts:88 | Không (bị chặn) | /community/trending/page.tsx, /resources/page.t... |
| online | GET | ${BASE}/online | true | src/modules/api/rest/livechat/livechat.ts:106 | Không (bị chặn) | /events/[slug]/page.tsx, /events/page.tsx |
| sendLiveChatHeartbeat | POST | ${BASE}/heartbeat | true | src/modules/api/rest/livechat/livechat.ts:125 | Không (bị chặn) | Không tìm thấy |
| drawSession | POST | ${BASE}/sessions | bỏ trống→true | src/modules/api/rest/mockinterview/mockinterview.ts:21 | Chưa rõ | Không tìm thấy |
| saveAnswer | POST | ${BASE}/sessions/${sessionId}/answers | bỏ trống→true | src/modules/api/rest/mockinterview/mockinterview.ts:32 | Chưa rõ | Không tìm thấy |
| gradeSession | POST | ${BASE}/sessions/${sessionId}/grade | bỏ trống→true | src/modules/api/rest/mockinterview/mockinterview.ts:40 | Chưa rõ | Không tìm thấy |
| syncTurns | POST | ${BASE}/sessions/${sessionId}/turns | bỏ trống→true | src/modules/api/rest/mockinterview/mockinterview.ts:51 | Chưa rõ | Không tìm thấy |
| getSession | GET | ${BASE}/sessions/${sessionId} | true | src/modules/api/rest/mockinterview/mockinterview.ts:60 | Chưa rõ | Không tìm thấy |
| getInProgress | GET | ${BASE}/in-progress | true | src/modules/api/rest/mockinterview/mockinterview.ts:68 | Chưa rõ | Không tìm thấy |
| getAttempts | GET | ${BASE}/attempts | true | src/modules/api/rest/mockinterview/mockinterview.ts:80 | Chưa rõ | Không tìm thấy |
| getAttemptBySession | GET | ${BASE}/attempts/by-session/${sessionId} | true | src/modules/api/rest/mockinterview/mockinterview.ts:88 | Có | /courses/[courseId]/learn/mock-interview/[sessi... |
| getStats | GET | ${BASE}/stats | true | src/modules/api/rest/mockinterview/mockinterview.ts:95 | Chưa rõ | Không tìm thấy |
| page | GET | /notifications${qs ? ?${qs} : } | true | src/modules/api/rest/notification/notification.ts:49 | Không (bị chặn) | /courses/category/[slug]/page.tsx, /courses/[co... |
| res | GET | /notifications/unread-count | true | src/modules/api/rest/notification/notification.ts:68 | Chưa rõ | Không tìm thấy |
| markNotificationRead | POST | /notifications/${id}/read | bỏ trống→true | src/modules/api/rest/notification/notification.ts:94 | Không (bị chặn) | Không tìm thấy |
| markAllNotificationsRead | POST | /notifications/read-all | bỏ trống→true | src/modules/api/rest/notification/notification.ts:106 | Không (bị chặn) | Không tìm thấy |
| getNotificationPreferences | GET | /notifications/preferences | true | src/modules/api/rest/notification/notification.ts:122 | Không (bị chặn) | /notifications/page.tsx |
| putNotificationPreferences | PUT | /notifications/preferences | true | src/modules/api/rest/notification/notification.ts:137 | Chưa rõ | Không tìm thấy |
| getNotificationMutes | GET | /notifications/mutes | bỏ trống→true | src/modules/api/rest/notification/notification.ts:151 | Chưa rõ | Không tìm thấy |
| createNotificationMute | POST | /notifications/mutes | bỏ trống→true | src/modules/api/rest/notification/notification.ts:165 | Chưa rõ | Không tìm thấy |
| deleteNotificationMute | DELETE | /notifications/mutes/${id} | bỏ trống→true | src/modules/api/rest/notification/notification.ts:178 | Chưa rõ | Không tìm thấy |
| listNotificationTemplates | GET | /admin/notification/templates | bỏ trống→true | src/modules/api/rest/notification/notification.ts:194 | Chưa rõ | Không tìm thấy |
| createNotificationTemplate | POST | /admin/notification/templates | bỏ trống→true | src/modules/api/rest/notification/notification.ts:208 | Chưa rõ | Không tìm thấy |
| updateNotificationTemplate | PUT | /admin/notification/templates/${id} | bỏ trống→true | src/modules/api/rest/notification/notification.ts:224 | Chưa rõ | Không tìm thấy |
| deleteNotificationTemplate | DELETE | /admin/notification/templates/${id} | bỏ trống→true | src/modules/api/rest/notification/notification.ts:237 | Chưa rõ | Không tìm thấy |
| presignPlatformFileUpload | POST | /platform/files/presign-upload | bỏ trống→true | src/modules/api/rest/platform/platform.ts:24 | Chưa rõ | Không tìm thấy |
| completePlatformFileUpload | POST | /platform/files/${fileId}/complete | bỏ trống→true | src/modules/api/rest/platform/platform.ts:34 | Chưa rõ | Không tìm thấy |
| getPlatformFile | GET | /platform/files/${fileId} | true | src/modules/api/rest/platform/platform.ts:41 | Chưa rõ | Không tìm thấy |
| deletePlatformFile | DELETE | /platform/files/${fileId} | bỏ trống→true | src/modules/api/rest/platform/platform.ts:48 | Chưa rõ | Không tìm thấy |
| listPlatformFeatureFlags | GET | /platform/feature-flags | true | src/modules/api/rest/platform/platform.ts:58 | Chưa rõ | Không tìm thấy |
| evaluatePlatformFeatureFlag | GET | /platform/feature-flags/${key} | true | src/modules/api/rest/platform/platform.ts:67 | Chưa rõ | Không tìm thấy |
| updatePlatformFeatureFlag | PUT | /platform/feature-flags/${key} | bỏ trống→true | src/modules/api/rest/platform/platform.ts:77 | Chưa rõ | Không tìm thấy |
| listPlatformConfigurations | GET | /platform/configurations | true | src/modules/api/rest/platform/platform.ts:90 | Chưa rõ | Không tìm thấy |
| updatePlatformConfiguration | PUT | /platform/configurations/${key} | bỏ trống→true | src/modules/api/rest/platform/platform.ts:105 | Chưa rõ | Không tìm thấy |
| listPlatformAiProviders | GET | /platform/ai/providers | true | src/modules/api/rest/platform/platform.ts:116 | Chưa rõ | Không tìm thấy |
| updatePlatformAiProvider | PUT | /platform/ai/providers/${id} | bỏ trống→true | src/modules/api/rest/platform/platform.ts:126 | Chưa rõ | Không tìm thấy |
| queryPlatformAuditLogs | GET | /platform/audit-logs | true | src/modules/api/rest/platform/platform.ts:143 | Chưa rõ | Không tìm thấy |
| listPlatformScheduledJobs | GET | /platform/jobs | true | src/modules/api/rest/platform/platform.ts:163 | Chưa rõ | Không tìm thấy |
| triggerPlatformScheduledJob | POST | /platform/jobs/${jobKey}/trigger | bỏ trống→true | src/modules/api/rest/platform/platform.ts:172 | Chưa rõ | Không tìm thấy |
| listPlatformJobRuns | GET | /platform/jobs/${jobKey}/runs | true | src/modules/api/rest/platform/platform.ts:181 | Chưa rõ | Không tìm thấy |
| getSelfProfile | GET | /profiles/me | true | src/modules/api/rest/profile/profile.ts:28 | Không (bị chặn) | /profile/portfolio/page.tsx, /profile/settings/... |
| updateSelfProfile | PATCH | /profiles/me | true | src/modules/api/rest/profile/profile.ts:44 | Không (bị chặn) | /profile/edit/page.tsx |
| uploadAvatar | PUT | /profiles/me/avatar | bỏ trống→true | src/modules/api/rest/profile/profile.ts:60 | Không (bị chặn) | /profile/edit/page.tsx |
| uploadCover | PUT | /profiles/me/cover | bỏ trống→true | src/modules/api/rest/profile/profile.ts:76 | Chưa rõ | Không tìm thấy |
| replaceSocialLinks | PUT | /profiles/me/social-links | bỏ trống→true | src/modules/api/rest/profile/profile.ts:92 | Không (bị chặn) | /profile/edit/page.tsx |
| getPrivacySettings | GET | /profiles/me/privacy | bỏ trống→true | src/modules/api/rest/profile/profile.ts:105 | Chưa rõ | Không tìm thấy |
| updatePrivacySettings | PUT | /profiles/me/privacy | bỏ trống→true | src/modules/api/rest/profile/profile.ts:119 | Chưa rõ | Không tìm thấy |
| createPortfolioProject | POST | /profiles/me/portfolio/projects | bỏ trống→true | src/modules/api/rest/profile/profile.ts:134 | Chưa rõ | Không tìm thấy |
| updatePortfolioProject | PATCH | /profiles/me/portfolio/projects/${id} | bỏ trống→true | src/modules/api/rest/profile/profile.ts:150 | Chưa rõ | Không tìm thấy |
| deletePortfolioProject | DELETE | /profiles/me/portfolio/projects/${id} | bỏ trống→true | src/modules/api/rest/profile/profile.ts:163 | Chưa rõ | Không tìm thấy |
| uploadPortfolioAsset | POST | /profiles/me/portfolio/assets | bỏ trống→true | src/modules/api/rest/profile/profile.ts:187 | Chưa rõ | Không tìm thấy |
| deletePortfolioAsset | DELETE | /profiles/me/portfolio/assets/${id} | bỏ trống→true | src/modules/api/rest/profile/profile.ts:201 | Chưa rõ | Không tìm thấy |
| addAchievement | POST | /profiles/me/achievements | bỏ trống→true | src/modules/api/rest/profile/profile.ts:215 | Chưa rõ | Không tìm thấy |
| deleteAchievement | DELETE | /profiles/me/achievements/${id} | bỏ trống→true | src/modules/api/rest/profile/profile.ts:228 | Chưa rõ | Không tìm thấy |
| getPublicProfile | GET | /profiles/${encodeURIComponent(username)} | false | src/modules/api/rest/profile/profile.ts:242 | Không (bị chặn) | /u/[username]/page.tsx, /profile/settings/page.... |
| getProfileFollowers | GET | /profiles/${encodeURIComponent(username)}/followers | bỏ trống→true | src/modules/api/rest/profile/profile.ts:258 | Không (bị chặn) | /profile/community/page.tsx, /profile/progress/... |
| getProfileFollowing | GET | /profiles/${encodeURIComponent(username)}/following | bỏ trống→true | src/modules/api/rest/profile/profile.ts:277 | Không (bị chặn) | /profile/community/page.tsx, /profile/progress/... |
| getProfileTimeline | GET | /profiles/${username}/timeline | bỏ trống→true | src/modules/api/rest/profile/profile.ts:299 | Chưa rõ | Không tìm thấy |
| moderateProfile | PATCH | /profiles/${userId}/moderate | bỏ trống→true | src/modules/api/rest/profile/profile.ts:318 | Chưa rõ | Không tìm thấy |
| getRecommendations | GET | /recommendations | true | src/modules/api/rest/recommendation/recommendation.ts:22 | Không (bị chặn) | /resources/recommended/page.tsx, /recommendatio... |
| submitRecommendationFeedback | POST | /recommendations/${id}/feedback | bỏ trống→true | src/modules/api/rest/recommendation/recommendation.ts:36 | Chưa rõ | Không tìm thấy |
| getMyPersonalizeContext | GET | /personalize/context/me | true | src/modules/api/rest/recommendation/recommendation.ts:47 | Chưa rõ | Không tìm thấy |
| getPersonalizeContextOf | GET | /personalize/contexts/${userId} | true | src/modules/api/rest/recommendation/recommendation.ts:62 | Chưa rõ | Không tìm thấy |
| getPersonalizeSignals | GET | /personalize/signals/${userId} | true | src/modules/api/rest/recommendation/recommendation.ts:80 | Chưa rõ | Không tìm thấy |
| getMyPersonalizeConsent | GET | /personalize/consent/me | true | src/modules/api/rest/recommendation/recommendation.ts:93 | Chưa rõ | Không tìm thấy |
| updateMyPersonalizeConsent | PUT | /personalize/consent/me | bỏ trống→true | src/modules/api/rest/recommendation/recommendation.ts:102 | Chưa rõ | Không tìm thấy |
| getPersonalizeExportDownload | GET | /personalize/exports/${id}/download | true | src/modules/api/rest/recommendation/recommendation.ts:139 | Chưa rõ | Không tìm thấy |
| getFeAlbum | GET | /resources/${resourceId}/images | bỏ trống→true | src/modules/api/rest/resource/exam.ts:43 | Có | /subjects/[subjectId]/practice/fe/[albumId]/pag... |
| uploadFeAlbumImage | POST | /resources/${resourceId}/images | bỏ trống→true | src/modules/api/rest/resource/exam.ts:69 | Không (bị chặn) | Không tìm thấy |
| reorderFeAlbumImages | PUT | /resources/${resourceId}/images/order | bỏ trống→true | src/modules/api/rest/resource/exam.ts:90 | Chưa rõ | Không tìm thấy |
| deleteFeAlbumImage | DELETE | /resources/${resourceId}/images/${imageId} | bỏ trống→true | src/modules/api/rest/resource/exam.ts:109 | Chưa rõ | Không tìm thấy |
| getFeImageComments | GET | /resources/${resourceId}/images/${imageId}/comments | bỏ trống→true | src/modules/api/rest/resource/exam.ts:133 | Không (bị chặn) | Không tìm thấy |
| postFeImageComment | POST | /resources/${resourceId}/images/${imageId}/comments | bỏ trống→true | src/modules/api/rest/resource/exam.ts:158 | Không (bị chặn) | Không tìm thấy |
| deleteFeImageComment | DELETE | /resources/comments/images/${commentId} | bỏ trống→true | src/modules/api/rest/resource/exam.ts:174 | Không (bị chặn) | Không tìm thấy |
| submitPeAnswer | POST | /resources/${resourceId}/pe-submissions | bỏ trống→true | src/modules/api/rest/resource/exam.ts:206 | Chưa rõ | Không tìm thấy |
| getMyPeSubmissions | GET | /resources/${resourceId}/pe-submissions/me | bỏ trống→true | src/modules/api/rest/resource/exam.ts:225 | Chưa rõ | Không tìm thấy |
| getPeSubmissionResult | GET | /resources/${resourceId}/pe-submissions/${submissionId}/results | bỏ trống→true | src/modules/api/rest/resource/exam.ts:243 | Chưa rõ | Không tìm thấy |
| listResources | GET | /resources | bỏ trống→true | src/modules/api/rest/resource/resource.ts:47 | Không (bị chặn) | /resources/page.tsx, /saved/page.tsx, /subjects... |
| getResourceDetail | GET | /resources/${id} | bỏ trống→true | src/modules/api/rest/resource/resource.ts:74 | Không (bị chặn) | /resources/[resourceId]/page.tsx, /subjects/[su... |
| createResource | POST | /resources | bỏ trống→true | src/modules/api/rest/resource/resource.ts:88 | Không (bị chặn) | Không tìm thấy |
| updateResource | PATCH | /resources/${id} | bỏ trống→true | src/modules/api/rest/resource/resource.ts:104 | Chưa rõ | Không tìm thấy |
| getResourceVersions | GET | /resources/${id}/versions | bỏ trống→true | src/modules/api/rest/resource/resource.ts:119 | Chưa rõ | Không tìm thấy |
| submitResource | POST | /resources/${id}/submit | bỏ trống→true | src/modules/api/rest/resource/resource.ts:131 | Không (bị chặn) | Không tìm thấy |
| approveResource | POST | /resources/${id}/approve | bỏ trống→true | src/modules/api/rest/resource/resource.ts:143 | Chưa rõ | Không tìm thấy |
| rejectResource | POST | /resources/${id}/reject | bỏ trống→true | src/modules/api/rest/resource/resource.ts:158 | Chưa rõ | Không tìm thấy |
| archiveResource | POST | /resources/${id}/archive | bỏ trống→true | src/modules/api/rest/resource/resource.ts:171 | Chưa rõ | Không tìm thấy |
| getResourceDownloadUrl | GET | /resources/${id}/download-url | bỏ trống→true | src/modules/api/rest/resource/resource.ts:185 | Chưa rõ | Không tìm thấy |
| getRelatedResources | GET | /resources/${id}/related | bỏ trống→true | src/modules/api/rest/resource/resource.ts:299 | Không (bị chặn) | /resources/[resourceId]/page.tsx |
| getResourceModerationQueue | GET | /resources/moderation/pending | true | src/modules/api/rest/resource/resource.ts:314 | Chưa rõ | Không tìm thấy |
| createCollection | POST | /resources/collections | bỏ trống→true | src/modules/api/rest/resource/resource.ts:335 | Không (bị chặn) | /resources/collections/page.tsx, /resources/rec... |
| getMyCollections | GET | /resources/collections/me | true | src/modules/api/rest/resource/resource.ts:351 | Không (bị chặn) | /resources/collections/page.tsx, /resources/rec... |
| getCollectionDetail | GET | /resources/collections/${id} | true | src/modules/api/rest/resource/resource.ts:370 | Không (bị chặn) | Không tìm thấy |
| updateCollection | PATCH | /resources/collections/${id} | bỏ trống→true | src/modules/api/rest/resource/resource.ts:386 | Không (bị chặn) | Không tìm thấy |
| deleteCollection | DELETE | /resources/collections/${id} | bỏ trống→true | src/modules/api/rest/resource/resource.ts:399 | Không (bị chặn) | Không tìm thấy |
| hideCollection | POST | /resources/collections/${id}/hide | bỏ trống→true | src/modules/api/rest/resource/resource.ts:411 | Chưa rõ | Không tìm thấy |
| addCollectionItem | POST | /resources/collections/${id}/items | bỏ trống→true | src/modules/api/rest/resource/resource.ts:426 | Không (bị chặn) | Không tìm thấy |
| removeCollectionItem | DELETE | /resources/collections/${id}/items/${resourceId} | bỏ trống→true | src/modules/api/rest/resource/resource.ts:442 | Không (bị chặn) | Không tìm thấy |
| updateCollectionItemNote | PATCH | /resources/collections/${id}/items/${resourceId} | bỏ trống→true | src/modules/api/rest/resource/resource.ts:459 | Không (bị chặn) | Không tìm thấy |
| reorderCollectionItems | PATCH | /resources/collections/${id}/items/reorder | bỏ trống→true | src/modules/api/rest/resource/resource.ts:475 | Chưa rõ | Không tìm thấy |
| rateResource | POST | /resources/${id}/ratings | bỏ trống→true | src/modules/api/rest/resource/resource.ts:493 | Không (bị chặn) | /resources/[resourceId]/reviews/page.tsx |
| getResourceRatings | GET | /resources/${id}/ratings | true | src/modules/api/rest/resource/resource.ts:509 | Không (bị chặn) | /resources/[resourceId]/reviews/page.tsx |
| getMyResourceRating | GET | /resources/${id}/ratings/me | bỏ trống→true | src/modules/api/rest/resource/resource.ts:530 | Không (bị chặn) | /resources/[resourceId]/reviews/page.tsx |
| deleteMyResourceRating | DELETE | /resources/${id}/ratings/me | bỏ trống→true | src/modules/api/rest/resource/resource.ts:543 | Không (bị chặn) | /resources/[resourceId]/reviews/page.tsx |
| bookmarkResource | PUT | /resources/${id}/bookmark | bỏ trống→true | src/modules/api/rest/resource/resource.ts:555 | Không (bị chặn) | Không tìm thấy |
| unbookmarkResource | DELETE | /resources/${id}/bookmark | bỏ trống→true | src/modules/api/rest/resource/resource.ts:569 | Không (bị chặn) | Không tìm thấy |
| getMyBookmarks | GET | /resources/me/bookmarks | true | src/modules/api/rest/resource/resource.ts:584 | Chưa rõ | Không tìm thấy |
| favoriteResource | PUT | /resources/${id}/favorite | bỏ trống→true | src/modules/api/rest/resource/resource.ts:609 | Không (bị chặn) | Không tìm thấy |
| unfavoriteResource | DELETE | /resources/${id}/favorite | bỏ trống→true | src/modules/api/rest/resource/resource.ts:623 | Không (bị chặn) | Không tìm thấy |
| getResourceComments | GET | /resources/${resourceId}/comments | true | src/modules/api/rest/resource/resource.ts:646 | Không (bị chặn) | Không tìm thấy |
| postResourceComment | POST | /resources/${resourceId}/comments | bỏ trống→true | src/modules/api/rest/resource/resource.ts:667 | Không (bị chặn) | Không tìm thấy |
| deleteResourceComment | DELETE | /resources/comments/${commentId} | bỏ trống→true | src/modules/api/rest/resource/resource.ts:680 | Không (bị chặn) | Không tìm thấy |
| likeResourceComment | PUT | /resources/comments/${commentId}/like | bỏ trống→true | src/modules/api/rest/resource/resource.ts:696 | Không (bị chặn) | Không tìm thấy |
| unlikeResourceComment | DELETE | /resources/comments/${commentId}/like | bỏ trống→true | src/modules/api/rest/resource/resource.ts:711 | Không (bị chặn) | Không tìm thấy |
| search | GET | /search | true | src/modules/api/rest/search/search.ts:14 | Không (bị chặn) | /search/page.tsx, /resources/page.tsx, /saved/p... |
| suggest | GET | /search/suggest | true | src/modules/api/rest/search/search.ts:30 | Chưa rõ | Không tìm thấy |
| reindex | POST | /admin/search/reindex | bỏ trống→true | src/modules/api/rest/search/search.ts:44 | Chưa rõ | Không tìm thấy |
| getReindexJob | GET | /admin/search/reindex/${jobId} | true | src/modules/api/rest/search/search.ts:51 | Chưa rõ | Không tìm thấy |
| listSubjects | GET | /subjects | false | src/modules/api/rest/subject/subject.ts:49 | Không (bị chặn) | /resources/upload/page.tsx, /subjects/page.tsx |
| createSubject | POST | /subjects | bỏ trống→true | src/modules/api/rest/subject/subject.ts:71 | Chưa rõ | Không tìm thấy |
| getSubjectDetail | GET | /subjects/${code} | false | src/modules/api/rest/subject/subject.ts:84 | Không (bị chặn) | /subjects/[subjectId]/page.tsx, /subjects/[subj... |
| updateSubject | PATCH | /subjects/${code} | bỏ trống→true | src/modules/api/rest/subject/subject.ts:100 | Chưa rõ | Không tìm thấy |
| publishSubject | POST | /subjects/${code}/publish | bỏ trống→true | src/modules/api/rest/subject/subject.ts:113 | Chưa rõ | Không tìm thấy |
| archiveSubject | POST | /subjects/${code}/archive | bỏ trống→true | src/modules/api/rest/subject/subject.ts:125 | Chưa rõ | Không tìm thấy |
| replaceSubjectPrerequisites | PUT | /subjects/${code}/prerequisites | bỏ trống→true | src/modules/api/rest/subject/subject.ts:140 | Chưa rõ | Không tìm thấy |
| replaceSubjectRelated | PUT | /subjects/${code}/related | bỏ trống→true | src/modules/api/rest/subject/subject.ts:156 | Chưa rõ | Không tìm thấy |
| getSubjectWorkspace | GET | /subjects/${code}/workspace | false | src/modules/api/rest/subject/subject.ts:173 | Không (bị chặn) | /subjects/[subjectId]/page.tsx, /subjects/[subj... |
| getSubjectLinks | GET | /subjects/${code}/links | false | src/modules/api/rest/subject/subject.ts:189 | Chưa rõ | Không tìm thấy |
| addSubjectLink | POST | /subjects/${code}/links | bỏ trống→true | src/modules/api/rest/subject/subject.ts:206 | Chưa rõ | Không tìm thấy |
| updateSubjectLink | PATCH | /subjects/${code}/links/${id} | bỏ trống→true | src/modules/api/rest/subject/subject.ts:223 | Chưa rõ | Không tìm thấy |
| deleteSubjectLink | DELETE | /subjects/${code}/links/${id} | bỏ trống→true | src/modules/api/rest/subject/subject.ts:239 | Chưa rõ | Không tìm thấy |
| getMySubjects | GET | /subjects/me | bỏ trống→true | src/modules/api/rest/subject/subject.ts:253 | Không (bị chặn) | /subjects/[subjectId]/members/page.tsx |
| joinSubject | POST | /subjects/${code}/join | bỏ trống→true | src/modules/api/rest/subject/subject.ts:265 | Không (bị chặn) | /subjects/[subjectId]/page.tsx |
| leaveSubject | DELETE | /subjects/${code}/membership | bỏ trống→true | src/modules/api/rest/subject/subject.ts:277 | Không (bị chặn) | /subjects/[subjectId]/page.tsx |
| getSubjectMembers | GET | /subjects/${code}/members | false | src/modules/api/rest/subject/subject.ts:296 | Không (bị chặn) | /subjects/[subjectId]/members/page.tsx, /subjec... |
| changeSubjectMemberRole | PUT | /subjects/${code}/members/${userId}/role | bỏ trống→true | src/modules/api/rest/subject/subject.ts:318 | Không (bị chặn) | Không tìm thấy |
| banSubjectMember | POST | /subjects/${code}/members/${userId}/ban | bỏ trống→true | src/modules/api/rest/subject/subject.ts:334 | Không (bị chặn) | Không tìm thấy |
| getSubjectStatistics | GET | /subjects/${code}/statistics | false | src/modules/api/rest/subject/subject.ts:350 | Có | /subjects/[subjectId]/statistics/page.tsx, /sub... |
| getPracticeQuiz | GET | /subjects/${code}/practice/quiz | true | src/modules/api/rest/subject/subject.ts:371 | Chưa rõ | Không tìm thấy |
| submitPracticeQuiz | POST | /subjects/${code}/practice/quiz/submit | bỏ trống→true | src/modules/api/rest/subject/subject.ts:390 | Chưa rõ | Không tìm thấy |
| getSubjectFlashcards | GET | /subjects/${code}/practice/flashcards | true | src/modules/api/rest/subject/subject.ts:409 | Chưa rõ | Không tìm thấy |
| reviewFlashcard | POST | /subjects/${code}/practice/flashcards/${cardId}/review | bỏ trống→true | src/modules/api/rest/subject/subject.ts:428 | Chưa rõ | Không tìm thấy |
| createFlashcardDeck | POST | /subjects/${code}/practice/flashcards/decks | bỏ trống→true | src/modules/api/rest/subject/subject.ts:448 | Chưa rõ | Không tìm thấy |
| updateFlashcardDeck | PATCH | /subjects/${code}/practice/flashcards/decks/${deckId} | bỏ trống→true | src/modules/api/rest/subject/subject.ts:465 | Chưa rõ | Không tìm thấy |
| deleteFlashcardDeck | DELETE | /subjects/${code}/practice/flashcards/decks/${deckId} | bỏ trống→true | src/modules/api/rest/subject/subject.ts:482 | Chưa rõ | Không tìm thấy |
| addFlashcardCards | POST | /subjects/${code}/practice/flashcards/decks/${deckId}/cards | bỏ trống→true | src/modules/api/rest/subject/subject.ts:498 | Chưa rõ | Không tìm thấy |
| updateFlashcardCard | PATCH | /subjects/${code}/practice/flashcards/cards/${cardId} | bỏ trống→true | src/modules/api/rest/subject/subject.ts:515 | Chưa rõ | Không tìm thấy |
| deleteFlashcardCard | DELETE | /subjects/${code}/practice/flashcards/cards/${cardId} | bỏ trống→true | src/modules/api/rest/subject/subject.ts:531 | Chưa rõ | Không tìm thấy |
| getMyWallet | GET | /wallet/me | true | src/modules/api/rest/wallet/wallet.ts:24 | Không (bị chặn) | /wallet/page.tsx, /profile/progress/page.tsx, /... |
| getMyTransactions | GET | /wallet/me/transactions | true | src/modules/api/rest/wallet/wallet.ts:43 | Không (bị chặn) | /wallet/page.tsx, /profile/progress/page.tsx |
| createTransfer | POST | /wallet/transfers | bỏ trống→true | src/modules/api/rest/wallet/wallet.ts:65 | Chưa rõ | Không tìm thấy |
| confirmTransfer | POST | /wallet/transfers/${id}/confirm | bỏ trống→true | src/modules/api/rest/wallet/wallet.ts:78 | Chưa rõ | Không tìm thấy |
| cancelTransfer | POST | /wallet/transfers/${id}/cancel | bỏ trống→true | src/modules/api/rest/wallet/wallet.ts:90 | Chưa rõ | Không tìm thấy |
| gift | POST | /wallet/gifts | bỏ trống→true | src/modules/api/rest/wallet/wallet.ts:102 | Chưa rõ | Không tìm thấy |
| redeemVoucher | POST | /wallet/vouchers/redeem | bỏ trống→true | src/modules/api/rest/wallet/wallet.ts:117 | Chưa rõ | Không tìm thấy |
| getMyReferral | GET | /wallet/referrals/me | true | src/modules/api/rest/wallet/wallet.ts:130 | Chưa rõ | Không tìm thấy |
| applyReferralCode | POST | /wallet/referrals/apply | bỏ trống→true | src/modules/api/rest/wallet/wallet.ts:145 | Chưa rõ | Không tìm thấy |
| getUserWallet | GET | /wallet/admin/wallets/${userId} | true | src/modules/api/rest/wallet/wallet.ts:160 | Chưa rõ | Không tìm thấy |
| listAdminTransactions | GET | /wallet/admin/transactions | true | src/modules/api/rest/wallet/wallet.ts:179 | Chưa rõ | Không tìm thấy |
| adjustWallet | POST | /wallet/admin/adjustments | bỏ trống→true | src/modules/api/rest/wallet/wallet.ts:201 | Chưa rõ | Không tìm thấy |
| listWorkflowDefinitions | GET | /workflow/definitions | true | src/modules/api/rest/workflow/workflow.ts:16 | Chưa rõ | Không tìm thấy |
| createWorkflowDefinition | POST | /workflow/definitions | bỏ trống→true | src/modules/api/rest/workflow/workflow.ts:25 | Chưa rõ | Không tìm thấy |
| createWorkflowInstance | POST | /workflow/instances | bỏ trống→true | src/modules/api/rest/workflow/workflow.ts:34 | Chưa rõ | Không tìm thấy |
| getWorkflowInstance | GET | /workflow/instances/${id} | true | src/modules/api/rest/workflow/workflow.ts:43 | Chưa rõ | Không tìm thấy |
| getWorkflowQueue | GET | /workflow/queue | true | src/modules/api/rest/workflow/workflow.ts:56 | Chưa rõ | Không tìm thấy |
| rebuildWorkflowQueue | POST | /workflow/queue/rebuild | bỏ trống→true | src/modules/api/rest/workflow/workflow.ts:70 | Chưa rõ | Không tìm thấy |
| claimWorkflowQueueItem | POST | /workflow/queue/${instanceId}/claim | bỏ trống→true | src/modules/api/rest/workflow/workflow.ts:78 | Chưa rõ | Không tìm thấy |
| transitionWorkflowInstance | POST | /workflow/instances/${id}/transitions | bỏ trống→true | src/modules/api/rest/workflow/workflow.ts:87 | Chưa rõ | Không tìm thấy |
| resubmitWorkflowInstance | POST | /workflow/instances/${id}/resubmit | bỏ trống→true | src/modules/api/rest/workflow/workflow.ts:97 | Chưa rõ | Không tìm thấy |


## Task 3: GraphQL

**Cơ chế Authentication trong GraphQL:**
Các API GraphQL xác thực thông qua Apollo Link chain (`src/modules/api/graphql/clients/links/attach-access-token.ts`). Link này được cấu hình để lấy token từ local storage thông qua hàm `getAccessToken()`. Nếu có token, nó sẽ được thêm vào header `Authorization: Bearer <token>`.

**Khả năng Opt-out:**
Dường như **KHÔNG CÓ** khả năng opt-out theo từng lời gọi API (per-call opt-out) giống như `restRequest`. Apollo client sẽ tự động kèm JWT cho **tất cả** request nếu tìm thấy token trong `LocalStorage`. Việc khách vãng lai gọi GraphQL tự nhiên sẽ không có token trong `LocalStorage`, nên Request đó sẽ được gửi đi như một call public. Việc refresh token proactive cũng được chặn ở GraphQL link đối với user chưa đăng nhập.

**Các GraphQL Query được sử dụng trên trang Public (guest-reachable routes):**
Dưới đây là một số GraphQL query được sử dụng ở các thành phần public/guest-reachable:
- `query-contents.ts` (Sử dụng để render chi tiết bài học/khóa học/bài báo).
- `query-community-feed.ts` (Sử dụng ở trang cộng đồng public).
- `query-blog-posts.ts` (Sử dụng ở trang Blog/Tin tức).
- `query-leaderboard.ts` (Bảng xếp hạng).
- `query-user-profile.ts` (Trang User Profile công khai).

## Nghi vấn — rows where the flag and the guest-reachability disagree, worst first:
- **src/modules/api/rest/chat/chat.ts:29** (`getConversations`)
  - Trigger: Khách chưa đăng nhập mở route tương ứng (VD: `/chat/page.tsx`).
  - Expect: Sẽ bị chặn 401 giả tạo hoặc refresh token vô cớ vì mang cờ `authenticated: true` thay vì `false`.

- **src/modules/api/rest/community/community.ts:505** (`getModerationQueue`)
  - Trigger: Khách chưa đăng nhập mở route tương ứng (VD: `/community/moderation/page.tsx`).
  - Expect: Sẽ bị chặn 401 giả tạo hoặc refresh token vô cớ vì mang cờ `authenticated: true` thay vì `false`.

- **src/modules/api/rest/course/course.ts:128** (`getTeachingCourses`)
  - Trigger: Khách chưa đăng nhập mở route tương ứng (VD: `/courses/teaching/page.tsx`).
  - Expect: Sẽ bị chặn 401 giả tạo hoặc refresh token vô cớ vì mang cờ `authenticated: true` thay vì `false`.

- **src/modules/api/rest/course/course.ts:370** (`getLessonDocuments`)
  - Trigger: Khách chưa đăng nhập mở route tương ứng (VD: `/courses/[courseId]/learn/layout.tsx`).
  - Expect: Sẽ bị chặn 401 giả tạo hoặc refresh token vô cớ vì mang cờ `authenticated: true` thay vì `false`.

- **src/modules/api/rest/course/course.ts:674** (`readLessonContent`)
  - Trigger: Khách chưa đăng nhập mở route tương ứng (VD: `/courses/[courseId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx, /courses/[courseId]/learn/layout.tsx`).
  - Expect: Sẽ bị chặn 401 giả tạo hoặc refresh token vô cớ vì mang cờ `authenticated: bỏ trống→true` thay vì `false`.



## Đã kiểm tra và đúng

- **src/modules/api/rest/gamification/gamification.ts** (`getMyStreak`, `getMyXpHistory`, v.v...): Bỏ trống tham số `authenticated` (tương đương `true`). Đây là chủ ý đúng vì mọi endpoint `/me/` đều là dữ liệu cá nhân yêu cầu token. Các component gọi đến đều nằm dưới auth context.
- **src/modules/api/rest/admin/admin.ts** (`bulkLockAdminUsers`, `getAdminAnalyticsDashboards`, v.v...): Hầu hết các lời gọi đều bỏ trống tham số `authenticated` để mặc định `true`. Các hàm này được gọi từ route `/admin/*` vốn đã được bảo vệ nghiêm ngặt bằng `AuthGuard` (check qua biến `isGated` và `guestReachable` = Không (bị chặn)).
- **src/modules/api/rest/keycloak-auth/register.ts** & `login.ts`: Xử lý auth thông qua form public và có cấu hình riêng để tránh interceptor / không mang bearer token khi không cần thiết. Thao tác login sinh token mới và gắn vào session thay vì đọc từ storage.
