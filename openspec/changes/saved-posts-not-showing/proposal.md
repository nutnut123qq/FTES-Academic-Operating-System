# Saved: bài viết đã lưu KHÔNG hiển thị khi bấm "Đã lưu" (đồng bộ set từ bookmark server)

## Why

Người dùng báo: *"Bài viết tôi đã lưu mà nó không hiển thị khi bấm vô saved"* — bài đã
bookmark không hiện trên trang `/saved`.

Trang `/saved` (`SavedLibrary`) quyết định **TẬP** bài viết đã lưu để hiển thị hoàn toàn
dựa trên store `savedItems` (Zustand + `localStorage`, chỉ có ở TRÌNH DUYỆT hiện tại), rồi
mới tra dữ liệu hiển thị từ danh sách bookmark THẬT của backend
(`GET /api/v1/community/bookmarks/posts`). Một hàng bài viết chỉ render khi id có mặt ở CẢ
HAI nguồn:

```
rows = items(localStorage)          // TẬP: đã lưu ở máy này chưa?
         .map(entry => postsById.get(entry.entityId) ?? drop)   // hiển thị: BE có không?
```

→ Bất kỳ bài nào đã bookmark TRÊN SERVER nhưng KHÔNG có trong `localStorage` của trình
duyệt này — lưu ở máy/thiết bị khác, sau khi xoá storage, hoặc lưu trước khi store ra đời —
đều bị **rơi im lặng**: BE có, nhưng `items` không có id → không thành hàng. Đó là gốc
"đã lưu mà không hiện".

Ghi-bookmark thì đã ĐÚNG (`SaveButton` bài viết gọi `PUT/DELETE /community/bookmarks/{id}`
THẬT + cập nhật store), endpoint đọc bookmark server ĐÃ tồn tại và hydrate đầy đủ
(tác-giả/tiêu-đề/snippet, mới-lưu-trước). Trang `/community/saved` (`CommunitySaved`) đọc
THẲNG từ endpoint server nên KHÔNG dính lỗi này. Chỉ `/saved` dính, vì nó lấy TẬP từ store
client thay vì từ danh sách bookmark server. (Đúng là "Follow-up (ngoài phạm vi)" mà change
`saved-library-real-feed` đã ghi nhận: "tập 'đã lưu' cho bài viết vẫn theo store localStorage
device-local".)

## What Changes

- **Đồng bộ (reconcile) TẬP bài đã lưu từ danh sách bookmark SERVER vào store** khi mở
  `/saved`: thêm store action `mergeSavedPosts(posts)` — hợp nhất BỔ SUNG (không bao giờ
  xoá, không ghi đè entry sẵn có) các bài BE trả về mà `localStorage` chưa có. `SavedLibrary`
  gọi nó trong một effect sau khi `useQueryBookmarkedPostsSwr` nạp xong.
- **Kết quả**: mọi bài đã bookmark trên server đều hiện thành hàng (kể cả lưu ở thiết bị
  khác / sau khi xoá storage); nút bỏ-lưu từng hàng đọc đúng trạng thái "đã lưu" (store giờ
  có id). Danh sách bookmark SERVER — không phải `localStorage` — trở thành nguồn-sự-thật
  cho việc bài nào đã lưu.
- `mergeSavedPosts` **no-op khi mọi id đã có** → gọi lặp mỗi render vẫn an toàn (không vòng
  lặp vô hạn). Thứ tự mới-lưu-trước của server được giữ trong các hàng vừa hợp nhất.
- **Không đổi**: tài liệu/khoá học vẫn theo store; dòng "nguồn" vẫn từ `source` lúc lưu
  (entry hợp nhất từ server mặc định "Cộng đồng"); `/community/saved` giữ nguyên (vốn đã đúng).

## Capabilities

### New Capabilities

Không thêm capability mới. Bổ sung cho capability `saved-library-page` một yêu cầu: TẬP bài
viết đã lưu phải phản ánh danh sách bookmark server, không chỉ localStorage của trình duyệt.

## Impact

- Affected specs: `saved-library-page` (thêm 1 requirement về nguồn của TẬP bài đã lưu).
- Affected code (FE-only):
  - `src/hooks/zustand/savedItems/store.ts` — thêm `mergeSavedPosts` (+ type `MergeSavedPostInput`).
  - `src/components/features/saved/SavedLibrary/index.tsx` — effect reconcile server → store + cập nhật TSDoc.
  - `src/hooks/zustand/savedItems/store.test.ts` — unit test cho `mergeSavedPosts` (thêm/không trùng/idempotent/thứ tự/persist).
- **Không đụng backend**: endpoint `GET /api/v1/community/bookmarks/posts` và
  `PUT/DELETE /community/bookmarks/{id}` đã tồn tại và đúng. Đây là FE-only fix.
- Giới hạn còn lại (ngoài phạm vi): `/saved` chỉ nạp TRANG ĐẦU bookmark (không cuộn vô tận
  như `/community/saved`) → người có >20 bookmark xem đủ ở `/community/saved`.
