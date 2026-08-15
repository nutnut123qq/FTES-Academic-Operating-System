# Tasks

## 1. BE (repo FTES-AOS-Backend)
- [x] 1.1 `GET /api/v1/community/public/posts/{id}` + DTO `PublicPostCard` (projection hẹp)
- [x] 1.2 `PostService.findPublicPost` — 3 lớp lọc: PUBLISHED whitelist, `deletedAt` null, nhóm `isPublic`
- [x] 1.3 Mọi lý do từ chối map về CÙNG một 404 `COMMUNITY_POST_NOT_FOUND`
- [x] 1.4 `CommunityMapper.toPublicCard` — excerpt qua `ModerationExcerpt.of`, ảnh IMAGE đầu, tên qua `DisplayNames`
- [x] 1.5 `SecurityConfig`: đúng 1 dòng `permitAll` khớp 1 segment
- [x] 1.6 `PublicPostCardTest`
- [ ] 1.7 Gọi thật trên apitest (200 cho bài public, 404 cho nhóm kín/DRAFT/đã xoá) — CHƯA

## 2. FE
- [x] 2.1 `getPublicPostCard(id)` với `authenticated: false` + type `PublicPostCard`
- [x] 2.2 `generateMetadata` của `/community/[postId]` đọc card public, bỏ `firstImage`, `toDescription` cắt 160
- [x] 2.3 404 → fallback `seo.communityPost.*` (không tiết lộ bài nhóm kín tồn tại)
- [x] 2.4 `toCommunityPost`: `snippet` qua `unwrapAutolinks` (dùng lại hàm có sẵn, không viết mới)
- [x] 2.5 `CommunityFeed/index.tsx` KHÔNG sửa (snippet vào đã sạch)
- [x] 2.6 `postLinks.test.ts`: +2 ca (url trần giữ nguyên; `a < b` / `<div>` không bị đụng)

## 3. Verify
- [x] 3.1 `npx tsc --noEmit` sạch
- [x] 3.2 `npx vitest run src/components/features/community/CommunityPostDetail/postLinks.test.ts`
- [ ] 3.3 Chạy crawler/OG debugger lên link bài thật đã deploy — CHƯA làm
