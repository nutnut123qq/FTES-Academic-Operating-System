# mention-typeahead-prefix-lookup — Ô gợi ý @ tra theo TIỀN TỐ

## Why

Gõ `@` trong ô soạn thảo không hiện gợi ý bao giờ. Không phải vì thiếu code — Tiptap `Mention`,
popup, debounce, điều hướng bàn phím đều đã có. Nó tra qua `GET /api/v1/search?types=user`, mà
chỉ mục tìm kiếm chạy bằng `websearch_to_tsquery` nên **khớp theo từ hoàn chỉnh**: gõ `fro`
không ra `frostes`, gõ `manhhd` không ra `manhhdss180112`. Phải gõ trọn username mới thấy gợi
ý — tức một ô tự-hoàn-thành chỉ trả lời sau khi người ta đã tự hoàn thành xong.

## What Changes

- `searchMentionUsers` đọc `GET /api/v1/profiles/mentionable?q=&limit=` (khớp tiền tố) thay cho
  `GET /search?types=user` (khớp từ hoàn chỉnh).
- Thêm client `getMentionableUsers` trong `modules/api/rest/profile`.
- Hàng trả về là `FollowEntry` (`username` + `displayName`) nên bỏ được bước lần `slug`/`title`
  trong nhóm hit của search.

## Impact

- Sửa: `RichTextEditor/mention-suggestion.ts`, `modules/api/rest/profile/profile.ts`.
- Popup, debounce, phím tắt, cách serialize mention: KHÔNG đổi. `ProfileMention` vẫn xuất
  `[@Nhãn](/u/username)` — username nằm ở đường dẫn, đúng thứ BE bóc ra để phát
  `community.user.mentioned` (xem change backend `frostes-mention-quota`).
- Yêu cầu đăng nhập: đường cũ suy biến về kết quả PUBLIC cho khách, đường mới trả 4xx. Không
  mất gì — tài liệu USER vốn để visibility AUTHENTICATED nên khách chưa bao giờ tag được ai.
