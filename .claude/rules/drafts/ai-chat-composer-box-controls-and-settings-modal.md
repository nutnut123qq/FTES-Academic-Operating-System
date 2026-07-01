# Draft — Panel chat AI: composer = 1 BOX chứa input flat + hàng controls (model · ⚙ · gửi) BÊN TRONG; "xoá lịch sử" vào modal Cài đặt, KHÔNG nút trần / toolbar đầu (2026-06-28)

- File/§ đích khi `/merge`: `elements/input.md` (composer box) + `concepts/` (chat panel) + liên quan [[when-drawer]] / [[elements/label]] (settings→modal) · [[no-emoji]]/[[elements/icon]].
- Bối cảnh: panel "Hỏi StarCi AI" (`ContentAiChat`, popover FAB trên trang đọc/challenge). Thầy chốt hướng **B** (qua `/starci-fe-ux-brainstorm`): dời bộ chọn model/settings từ **toolbar trên cùng** → **vào trong composer**; "Xoá lịch sử" → **Link Cài đặt (⚙) mở modal**. Rồi đính chính: *"phải bỏ B trong cái text area chứ"* = controls phải nằm **TRONG cùng 1 box với input**, không phải input riêng + hàng controls dưới.

## Luật (STRICT)
- **Composer của panel chat AI = 1 BOX bounded duy nhất** (`rounded-2xl border border-default bg-surface px-3 py-2`, `focus-within:border-accent`) chứa **2 tầng**: (1) ô nhập **flat** ở trên, (2) hàng controls `[model picker ▾]  ·  flex-1  ·  [⚙ settings]  [gửi]` ở dưới — **TẤT CẢ bên trong box**. KHÔNG tách thành "input có viền riêng" + "hàng controls trần bên dưới" (đó là 2 khối rời, không phải composer-in-box). Ref: Claude.ai / Perplexity / Vercel AI Elements (model selector + actions nằm TRONG khung composer cạnh nút gửi).
- **Ô nhập trong composer-box = `<input>`/`<textarea>` THUẦN flat** (`bg-transparent text-sm text-foreground outline-none placeholder:text-muted`), KHÔNG `TextField`/`Input` HeroUI. Đây là **NGOẠI LỆ có chủ đích** của luật "ô nhập = HeroUI Input" ([[elements/input]]): khi input phải hoà vào 1 box chung với controls (composer chat), HeroUI Input mang viền/field-bg riêng → lồng 2 viền. Box ngoài lo viền + `focus-within`; input bên trong phẳng. (Chỉ áp cho composer-in-box; field đứng riêng vẫn dùng HeroUI Input.)
- **KHÔNG toolbar điều khiển ở ĐẦU panel chat.** Model picker + settings thuộc **cụm composer (đáy)**, cạnh nút gửi — không phải hàng riêng trên cùng (đẩy thread xuống + tách model khỏi hành động gửi). Thread chiếm trọn phần trên.
- **Hành động PHÁ HUỶ (xoá lịch sử hội thoại) KHÔNG để nút trần** cạnh model. Render thành **`⚙ Cài đặt`** (icon-only `aria-label`, `variant="tertiary"`) trong composer → mở **modal** (HeroUI `Modal`): modal chứa (a) model trả lời (read-only context) + (b) "Xoá lịch sử chat" `variant="danger"` + mô tả scope ("xoá toàn bộ hội thoại của BÀI NÀY"). Lý do: xoá hội thoại = **privacy/data-control** → thuộc settings, không phơi sỗ sàng (dễ bấm nhầm). Modal đã là 1 bước xác nhận → đủ.
- **Dropdown của composer đáy mở LÊN** (`placement="top start"`) vì composer ở chân panel.
- **Nút gửi/⚙ = icon-only** (`PaperPlaneTiltIcon` / `GearIcon` phosphor, `size-5`, `isIconOnly`, `aria-label`) cho gọn hàng controls. 1 primary (gửi) trong composer.

## Phân biệt 3 hướng (đã brainstorm — thầy chọn B)
- A — toolbar 1 hàng RIÊNG dưới composer (tách khối). B — controls TRONG box composer (chọn). C — chỉ ⚙ ở header, model thành caption. → "B" = controls **trong cùng box input**, không phải hàng rời.

## Áp đầu (2026-06-28)
- `ContentAiChat`: bỏ toolbar trên; composer = box (input flat + hàng [model picker · ⚙ · gửi]); modal Cài đặt (model read-only + Xoá lịch sử danger). Bỏ import `TextField`/`Input` HeroUI. i18n `contentAi.{settings,modelLabel,clearHint,clearAction}` (vi+en). tsc/eslint sạch. Doc brainstorm: `ContentAiChat/UX-BRAINSTORM.md` (chốt B).
