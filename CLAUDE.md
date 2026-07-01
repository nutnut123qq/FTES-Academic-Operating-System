# FTES AOS — Working Agreement

Dự án: **FTES Academic Operating System** (enterprise v2), dựng trên skeleton đã strip từ
StarCi Academy. Scope tổng: [`ftes.txt`](ftes.txt). Kế hoạch: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Quy trình BẮT BUỘC mỗi task (không ngoại lệ)

1. **OpenSpec cho MỌI thay đổi** — không code thẳng. Chạy vòng:
   `openspec new change <name>` → tạo artifacts (proposal/design/tasks) → `/opsx:apply` implement
   → `/opsx:archive` khi xong. CLI: `openspec` (v1.5.0). Skill: `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`.
2. **Code FE dùng skill nhà** (không tự chế pattern):
   - Code mới (component/hook/slice/form/page) → `starci-fe-cannon-apply`.
   - Layout/UX trang → `starci-fe-ux-brainstorm` (chốt) → `starci-fe-ux-apply` (dựng).
   - Soi code cũ → `starci-fe-cannon-audit`.
3. **Verify trước khi commit**: `npm run build` phải xanh (dùng webpack) + `tsc --noEmit` sạch.

## Build/run

- `npm run build` → **webpack** (`next build --webpack`). Turbopack build panic trong env này
  (Windows + path có dấu cách) — đừng đổi lại turbopack cho build.
- `npm run dev` → turbopack, chạy tốt.

## Ranh giới

- **StarCI là hệ sinh thái NGOÀI** (§23 spec): profile/skill/portfolio sync, "Suggested StarCI Roadmap".
  Branding cũ đã đổi StarCi→FTES AOS, nhưng tên "StarCI" ở §21/§23 là đối tác thật — **giữ nguyên**.
- Commit: 1 OpenSpec change = 1 commit. **Không** `git push`, **không** deploy, **không** lệnh phá huỷ nếu chưa hỏi.
- FE-only ở đây; thiếu contract BE thì mock/placeholder + ghi giả định, đừng bịa API đã tồn tại.
