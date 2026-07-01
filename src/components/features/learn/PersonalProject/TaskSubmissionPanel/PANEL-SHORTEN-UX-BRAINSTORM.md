# Rút gọn panel "Github dự án" — drawer cài đặt (2026-06-21)

Trang: personal-project task. Panel phải (`TaskSubmissionPanel` → `PersonalProjectSubmission`) quá dài (6 khối dọc):
Ngôn ngữ · URL · Nhánh · Token GitHub · CTA · Kết quả.

## Vấn đề
Panel sticky bên phải dài lê thê. Phần lớn là **config set-once** (ngôn ngữ chấm điểm, nhánh, token repo riêng tư)
— hiếm khi đổi nhưng chiếm chỗ ngang với flow chính.

## Hướng đã cân nhắc
- **A** ⭐ **Drawer cài đặt** (CHỐT): dồn config set-once vào Drawer, panel chỉ giữ URL + CTA + kết quả.
- **B** Gập riêng Token vào accordion: nhẹ tay nhưng panel vẫn còn ngôn ngữ + nhánh → chưa gọn.

## ✅ Chốt: A — progressive disclosure qua Drawer
Config set-once → lớp phụ (drawer), giữ lớp chính cho action chính (ref: progressive disclosure — drawer/modal
cô lập sub-task config). Panel = vòng lặp **dán repo → Đánh giá → xem kết quả**.

### IA panel (rút còn 3 khối)
1. **URL GitHub** — input + autosave status (cái hay đổi nhất).
2. **Hàng "Cài đặt chấm điểm"** (`blocks` button/row) → mở Drawer; hiện **read-only** trạng thái hiện tại:
   `TypeScript · nhánh main` (+ "token ✓" nếu đã lưu token). Icon `Gear` + caret phải.
3. **CTA "Đánh giá tiến độ"** + kết quả (`TaskResults`: Xem chi tiết phản hồi / Xem thêm).

### Drawer "Cài đặt chấm điểm" (`Drawer` HeroUI, placement="right")
- **Ngôn ngữ chấm điểm** — Tabs TS/Java/C#/Go + hint.
- **Nhánh cần đánh giá** — input + Đặt lại.
- **Token GitHub (repo riêng tư)** — input + hint + Lưu/Xóa token.

### Triển khai (cho /starci-fe-ux-apply)
- **Tách `PersonalProjectSubmission`**: giữ phần URL ở panel; **dời** 3 section (ngôn ngữ/nhánh/token) sang một
  component mới `GithubGradingSettings` render TRONG Drawer. Form state vốn ở **zustand**
  (`usePersonalProjectGithubStore` / `usePersonalProjectGithubForm`) → chỉ **dời JSX**, KHÔNG đổi logic autosave.
- **`enableSync` vẫn ở 1 owner duy nhất** (panel) để không double-fire — drawer đọc cùng store, không bật sync lại.
- **Summary row** đọc `lang` + `branch` (+ có token?) từ store để hiển thị read-only.
- Drawer open state = local `useState` ở `TaskSubmissionPanel`.
- **State đặc thù:** autosave status của từng field giữ nguyên (đã fix reserve-height + chống loop). Token vẫn
  write-only. a11y: Drawer focus-trap (HeroUI lo), summary row có `aria-label` + `aria-expanded`.
- KHÔNG đụng `TaskResults` / `TaskActions` / desktop sticky panel logic.

### Refs
- [progressive disclosure (UXPin)](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/) — drawer cô lập config set-once, giữ primary action.
- Pattern "Advanced settings" drawer: Vercel deploy config, GitHub Actions settings.
