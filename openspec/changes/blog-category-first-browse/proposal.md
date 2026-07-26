# Blog: bỏ dải "Chủ đề" cứng, đẩy bộ lọc danh mục lên đầu

## Why

`/blog` mở đầu bằng `TopicsStrip` — một dải chip **hard-code** trong FE
(`CQRS`, `Kafka`, `RAG · Qdrant`, `CDC`, `Keycloak`, `Judge0`, `Media`, `Mount`).
Dải này chỉ là khung kể chuyện: **không bấm được, không lọc gì**, và không hề
đồng bộ với taxonomy thật (`GET /blog/categories`). Nó chiếm đúng vị trí đầu
trang mà bộ lọc danh mục thật (`CategoryFilter`) đáng được đứng, còn
`CategoryFilter` thì bị đẩy xuống dưới ô tìm kiếm và **biến mất khi đang search**.

Kết quả: người đọc thấy một hàng chip vô dụng trước, hàng chip có tác dụng sau.

## What Changes

- **Xoá `TopicsStrip`** (component + mount trong `BlogList`) và key i18n `blog.topics`
  ở `vi.json` + `en.json`.
- **`CategoryFilter` lên vị trí đầu** cụm browse (trên ô tìm kiếm) — chip danh mục
  thật từ BE trở thành thứ đầu tiên người đọc thấy.
- **Không còn ẩn `CategoryFilter` khi đang tìm kiếm**: hàng chip giữ nguyên vị trí
  (không nhảy layout), bấm 1 danh mục vẫn xoá ô tìm kiếm và reset phân trang như cũ
  (`changeCategory`), nên hành vi lọc không đổi.

## Impact

- Affected specs: blog browse (chrome trang danh sách).
- Affected code: `src/components/layouts/blog/BlogList/index.tsx`,
  `src/components/layouts/blog/BlogList/TopicsStrip/*` (xoá),
  `src/messages/{vi,en}.json`.
- Không đụng backend: dữ liệu danh mục đã lấy từ `getBlogCategories()`.
