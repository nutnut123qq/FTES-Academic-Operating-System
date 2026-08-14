# Tasks — mention-typeahead-prefix-lookup

## 1. Client
- [x] 1.1 `getMentionableUsers(q, limit)` trong `modules/api/rest/profile/profile.ts` (`authenticated: true`).

## 2. Typeahead
- [x] 2.1 `searchMentionUsers` đọc client mới; map `FollowEntry` → `MentionUser`; bỏ nhánh lần `slug`/nhóm hit của search.

## 3. Verify
- [x] 3.1 `mention-suggestion.test.ts` viết lại quanh lookup mới (gồm ca tiền tố ngắn). 7/7 xanh.
- [x] 3.2 `tsc --noEmit` sạch, eslint sạch.
