# Tasks — community-threads-redesign

## 1. Shell

- [x] 1.1 `CommunityShell`: bỏ cover banner + avatar overlap; dựng sticky header row
      (avatar sm + tên + members ẩn `<sm` + `ExtendedTabs` underline + Dropdown ⋯
      với 4 entry: Đăng bài / Bảng uy tín / Bình chọn / Kiểm duyệt). Cột nội dung
      `max-w-[620px]`. Skeleton row gọn.
- [x] 1.2 i18n `communityHub.{members,more,menu.*,composer.whatsNew}` (vi + en).

## 2. Feed

- [x] 2.1 Block mới `blocks/feed/ThreadsPostRow` (props-only): grid
      `[48px_minmax(0,1fr)]`, avatar slot, header line (name + time), children slots;
      threadline prop.
- [x] 2.2 `CommunityFeed`: đổi sang cột `divide-y divide-separator`, dùng
      `ThreadsPostRow`; link chỉ phủ title + snippet; giữ hooks/optimistic như cũ.
- [x] 2.3 `PostEngagementBar`: prop `hideZeroCounts` (default false); bật cho
      community feed + detail.
- [x] 2.4 Composer trigger row đầu feed → overlay store
      (`useCommunityComposerOverlayState` + OverlayKey + ModalContainer); tách
      `CommunityComposerForm` dùng chung modal + `/community/new`.

## 3. Post detail

- [x] 3.1 `CommunityPostDetail`: cùng anatomy `ThreadsPostRow`; threadline nối xuống
      comments khi có bình luận.

## 4. Verify

- [x] 4.1 `tsc --noEmit` sạch + eslint files đã chạm.
- [x] 4.2 `npm run build` (webpack) xanh.
- [x] 4.3 Preview dev: screenshot feed + modal composer + detail, light/dark.

> Note verify 4.3: preview headless không chụp được screenshot / không bắn được press
> React Aria (hạn chế môi trường, đã ghi decision/feed.md Gotchas) — đã verify bằng
> a11y snapshot + preview_inspect: panel bo góc + hairline, sticky header blur, modal
> composer mở + autofocus title, threadline render trên detail. Tương tác HeroUI
> (like/tabs/menu) cần test tay trên browser thật.
