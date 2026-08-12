## Đã kiểm tra và KHÔNG có lỗi
- `useQueryWeeklyChallengeSwr.ts`: Trả về dữ liệu mock giả nhưng component sử dụng nó (`WeeklyChallengeCard`) đã bị comment/không được render ở bất kỳ đâu trong ứng dụng thật (cụ thể là `AnalyticsDashboard/OverviewTab` không import và render nó). Do đó không có bug rò rỉ dữ liệu fake ra UI người dùng.
- `useQueryContributionCalendarSwr.ts`: Hook này tự sinh dữ liệu hoạt động dựa vào hash theo ngày (`dayOfYear`), tuy nhiên component sử dụng nó (`OverviewContributions` trong thư mục `AnalyticsDashboard`) cũng không được render ở bất kỳ màn hình nào.
- `useQueryAiQuotaSwr.ts`: Không fake dữ liệu, gọi API BE thực sự (`getMyAiQuota`).
- `useQueryContinueLearningSwr.ts`: Không fake dữ liệu, gọi API BE thực sự (`getMyEnrollments`).
- `StreakHeatmap`: Model không tự sinh fake data, chỉ fill các ngày không có data (từ BE trả về mảng thưa) bằng `xp: 0`.
- `LeaderboardShell`: Không tự sinh fake level cho user (bình luận trong file ghi rõ là ẩn thay vì bịa ra).
- `useQueryRewardWalletSwr.ts`: Không fake dữ liệu, gọi API BE thực sự (`getMyWallet`).
- **Live Dashboard (`src/components/features/dashboard/**`)**: Đã kiểm tra các tab `OverviewTab`, `CoursesTab`, `ExploreTab` và `CommunityTab`. Không có tab nào import hay render các hooks chứa dữ liệu fake (`useQueryWeeklyChallengeSwr` hoặc `useQueryContributionCalendarSwr`). Component `OverviewContributions` dùng ở đây gọi hook `useQueryOverviewContributionsSwr` (trả về dữ liệu thực tế từ BE) chứ không dùng `useQueryContributionCalendarSwr`.
