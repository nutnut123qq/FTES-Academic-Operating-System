# Tasks

## 1. Metadata chia sẻ theo trang
- [x] 1.1 `/courses/[courseId]`: bỏ `"use client"` ở page, thành server wrapper + `generateMetadata`
- [x] 1.2 Fetch course theo slug memo hoá bằng `React.cache`, lỗi → `{}`
- [x] 1.3 `toDescription` strip HTML + ký tự markdown, cắt 160 ký tự
- [x] 1.4 `/subjects/[subjectId]`: `generateMetadata` cùng khuôn, tên theo locale, title `CODE — Tên`
- [x] 1.5 `.env.production`: thêm `NEXT_PUBLIC_SITE_URL` + comment hậu quả nếu thiếu

## 2. Route unfurl + rào SSRF
- [x] 2.1 `GET /api/unfurl?url=…`, `runtime: "nodejs"` (guard cần `node:dns/promises`)
- [x] 2.2 `parseTargetUrl`: chỉ http/https, cấm credentials, chặn hostname trần + hậu tố nội bộ
- [x] 2.3 Chặn dải IP: loopback, RFC1918, `169.254.x`, CGNAT, benchmarking, multicast/reserved, `0.x`
- [x] 2.4 Resolve DNS lại trước MỖI hop; tự đi redirect tối đa 3 hop, mỗi hop validate lại
- [x] 2.5 Một deadline 5s cho cả chuỗi (`AbortSignal.timeout`)
- [x] 2.6 Cache trong tiến trình: 10 phút cho thành công, 60s cho thất bại, tối đa 200 entry
- [x] 2.7 Trần body 1 MiB + docblock ghi rõ số đo (og:title ở ~byte 309k) và vì sao không dừng ở `</head>`
- [x] 2.8 `unfurl.test.ts` cho parse/guard

## 3. Card xem trước trong bài
- [x] 3.1 `postLinks.ts`: `firstLinkUrl` (bỏ code fence/inline code, cắt dấu câu đuôi) + `unwrapAutolinks`
- [x] 3.2 `LinkPreview`: fetch qua `/api/unfurl`, không có data → render `null`
- [x] 3.3 `CommunityPostContent`: render thân đã `unwrapAutolinks` + card cho link đầu tiên
- [x] 3.4 i18n `linkPreview.*` (en + vi)

## 4. Verify
- [x] 4.1 `npx tsc --noEmit` sạch
- [x] 4.2 `npx vitest run src/app/api/unfurl/unfurl.test.ts`
- [ ] 4.3 Chạy Facebook/Zalo debugger lên link thật đã deploy — CHƯA làm
