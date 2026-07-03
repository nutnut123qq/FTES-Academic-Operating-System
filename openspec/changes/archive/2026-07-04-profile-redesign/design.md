## Context

Trang profile hiện tại (`/profile/*`) dùng layout 2 cột với identity card bên trái và tab + content bên phải. Vấn đề chính là visual hierarchy yếu: card trong card, tab như nút rờ, nội dung dạng label:value phẳng. Redesign tập trung vào presentation, giữ nguyên data contract (hook SWR, mock, type).

## Goals / Non-Goals

**Goals:**
- Identity trông như "nền tĩnh" (sidebar trần), content là các card bên phải.
- Tab bar có underline/indicator rõ ràng bằng HeroUI `ExtendedTabs`.
- Mỗi section có tiêu đề, card, empty/loading/error state tử tế.
- Social links có icon brand + hover state.
- Đẹp cả dark và light nhờ semantic tokens.
- Skeleton mirror layout thật.

**Non-Goals:**
- Không thêm dependency mới.
- Không backend/API mới.
- Không thay đổi type/interface của hook.
- Không tái cấu trúc CRUD logic của Portfolio.

## Decisions

1. **Sidebar trần thay vì card**
   - Lý do: giảm cảm giác hộp trong hộp, identity trở thành nền tĩnh cho content động bên phải.
   - Tham chiếu: `PublicProfile` anh em dùng sidebar trần.

2. **ExtendedTabs thay cho hàng Button**
   - Lý do: HeroUI first, có indicator accent, a11y tablist tốt hơn.
   - Active state dựa trên `pathname` như cũ.

3. **LabeledCard + MetricCard cho content**
   - Lý do: tái sử dụng block sẵn có, tiêu đề ngoài card tạo nhịp rõ.
   - Academic chuyển sang grid tiles vì các field là KPI ngang hàng.

4. **Avatar gradient ring**
   - Lý do: mô phỏng rank ring của reference, tạo điểm nhấn cho identity.
   - Không hardcode màu: dùng `bg-gradient-to-tr from-accent to-success` (accent + success token).

5. **Social icon brand từ `react-icons/fa6`**
   - Lý do: GitHub/LinkedIn là brand mark quen thuộc; website/email dùng Phosphor `GlobeIcon`/`EnvelopeIcon`.

6. **SkillGraph vào AsyncContent**
   - Lý do: đồng bộ loading/empty/error với phần còn lại của Progress tab.

## Risks / Trade-offs

- [Risk] `ExtendedTabs` cần HeroUI compound API (`Tabs.List`, `Tabs.Tab`, `Tabs.Indicator`) → đảm bảo import đúng.
  - Mitigation: copy pattern từ các feature đã dùng `ExtendedTabs`.
- [Risk] Chuyển Academic sang tiles làm mất dạng label:value rõ ràng.
  - Mitigation: giữ label dưới value trong tile; GPA tile nổi bật hơn.
- [Risk] Layout 2 cột trên mobile có thể bị xếp chồng không đẹp.
  - Mitigation: `md:flex-row`, sidebar full width trên mobile.

## Migration Plan

Không cần migration. Thay đổi là FE-only, không ảnh hưởng dữ liệu.

## Open Questions

Không có.
