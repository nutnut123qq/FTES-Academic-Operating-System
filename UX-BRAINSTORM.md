# Profile Redesign — UX Brainstorm

> Ngữ cảnh: redesign trang profile học viên (`/profile/*`) của FTES AOS.  
> Ponytail mindset: **KHÔNG** thêm dependency, **KHÔNG** backend, giữ nguyên mock + SWR hook hiện có, chỉ thay phần trình bày. Diff ngắn nhất mà đẹp.

## Những điểm đau của trang hiện tại

1. **Identity bị "nhốt" trong card**: cột trái là một card có border, tạo cảm giác "hộp trong hộp" khi bên phải cũng toàn card.
2. **Tab là hàng nút rồi**: `Button` variant rờ rợ, không có underline/indicator rõ ràng, không dùng HeroUI `Tabs`.
3. **Personal/Academic là label:value phẳng**: các dòng `border + p-4` lặp lại, thiếu icon, thiếu hover state.
4. **Thiếu skeleton/empty ở Personal & Academic**: đang `return null` khi loading; trống khi không có dữ liệu.
5. **Progress chưa card-hoá**: các khối XP/rank/heatmap/badges đang là panel `bg-default/40` tự viết, chưa dùng `LabeledCard`/`MetricCard`.
6. **SkillGraph nằm ngoài `AsyncContent`**: loading không đồng bộ với phần còn lại.

## North-star (học từ `PublicProfile` anh em)

- **Identity là "nền tĩnh"**: sidebar TRẦN (không card), chỉ có avatar, tên, headline, campus, chip streak/rank. Cảm giác như một cột thông tin cố định.
- **Content là các card ở bên phải**: mỗi section là `LabeledCard` (tiêu đề ngoài card) hoặc `MetricCard` grid.
- **Tab bar dạng underline**: `ExtendedTabs` (HeroUI `Tabs` secondary) với indicator accent, icon + label trên desktop, label gọn trên mobile.
- **Avatar nổi bật**: gradient ring (mô phỏng rank ring) quanh avatar fallback, kích thước lớn hơn (`size-24`/`size-28`).
- **Social links**: icon brand (GitHub/LinkedIn → `react-icons/fa6`, website/email → Phosphor) + hover state, không còn dạng label:value.

## Layout đề xuất

### A. "Bare identity + carded tabs" (KHUYẾN NGHỊ)

```text
+------------------------------------------+
| Breadcrumb: Trang chủ › Hồ sơ            |
+------------------------------------------+
|                                          |
|  +----------------+   +----------------+ |
|  |   [avatar]     |   | [tabs underline]|
|  |   Họ và tên    |   +----------------+ |
|  |   headline     |   |                | |
|  |   campus       |   |  [card About]  | |
|  |                |   |                | |
|  |  🔥 7  🏆 #3   |   |  [card Socials]| |
|  |                |   |                | |
|  |  bio           |   |                | |
|  +----------------+   +----------------+ |
|                                          |
+------------------------------------------+
```

Desktop: 2 cột `md:flex-row`, sidebar `md:w-72` bên trái, content bên phải `flex-1`.  
Mobile: xếp chồng, sidebar lên trước, tab bar ngay dưới.

#### Cấu trúc chi tiết

**Sidebar (trần, không card)**
- Avatar fallback 96–112 px với gradient ring (`bg-gradient-to-tr from-accent to-success`) padding 3px.
- Tên `type="h4" weight="bold"`.
- Headline `body-sm muted`.
- Campus `body-xs muted` + `MapPinIcon` (Phosphor).
- Hai chip streak/rank dạng `GamificationChip` (hiện có), nhưng sắp xếp ngang gọn.
- Bio `body-sm muted`.
- Một CTA chính duy nhất: "Chỉnh sửa hồ sơ" (secondary) → đi `/profile/edit`.

**Tab bar**
- Dùng `ExtendedTabs` với `Tabs.ListContainer > Tabs.List > Tabs.Tab` + `Tabs.Indicator`.
- 5 tab: Cá nhân / Học vấn / Hồ sơ / Cộng đồng / Tiến độ.
- Không border-bottom trên tab bar vì `ExtendedTabs` đã xóa baseline; toàn bộ tab bar nằm trong một `Card` (hoặc hand-rolled panel) có border-bottom accent indicator tự xử lý.

**Nội dung tab**
- Personal: `LabeledCard` "Giới thiệu" + `LabeledCard` "Liên kết".
  - Social links dạng list row: icon brand + tên hiển thị gọn (VD `github.com/vanhoc`) + `CaretRightIcon` caret, hover `bg-default/40`.
- Academic: một `LabeledCard` "Học vấn" chứa grid 2 cột các `MetricCard`-style tiles (Trường, Cơ sở, Chuyên ngành, Học kỳ, GPA). GPA là tile nổi bật hơn (accent tint).
- Portfolio: giữ CRUD-lite hiện có nhưng bọc trong `LabeledCard` "Dự án" + "Liên kết ngoài", empty state dùng `EmptyContent`.
- Community: `LabeledCard` "Uy tín" chứa grid 4 `MetricCard` + `LabeledCard` "Bài viết gần đây" chứa list row.
- Progress: `LabeledCard` XP (chứa `ProgressMeter`) + Rank (`LabeledCard`) + Heatmap (`LabeledCard`) + Badges (`LabeledCard` frameless vì con là grid card). `SkillGraph` đưa vào trong `LabeledCard` "Kỹ năng" và bọc `AsyncContent`.

### B. "Hero top + tabs below" (phương án dự phòng)

```text
+------------------------------------------+
| [cover placeholder]                      |
|        [avatar]  Tên              [Edit] |
|        headline campus                   |
+------------------------------------------+
| [tabs underline]                         |
+------------------------------------------+
| [cards...]                               |
+------------------------------------------+
```

- Gọn hơn, dễ responsive, nhưng mất cảm giác "identity là nền tĩnh".
- Phù hợp nếu sau này có cover photo.

## Quyết định chọn phương án A

Lý do:
- Khớp north-star của `PublicProfile`.
- Tận dụng được `LabeledCard`, `MetricCard`, `ExtendedTabs` sẵn có trong repo.
- Sidebar trần làm giảm cảm giác "hộp trong hộp".
- Tab underline rõ ràng hơn hàng nút rời.
- Dễ áp dụng spacing scale `0/2/3/6/8` của nhà.

## Ràng buộc design

- **Tokens**: chỉ dùng `--accent`, `bg-default`, `text-muted`, `border-separator`, `text-foreground`. Không hardcode màu.
- **Spacing**: `gap-8` giữa 2 cột layout, `gap-6` giữa các section/card, `gap-3` trong card, `gap-2` icon+label, `gap-0` title+desc.
- **Radius**: card `rounded-2xl` (hand-rolled) / HeroUI `Card` tự xử lý, avatar `rounded-full`, ring gradient.
- **Icons**: Phosphor `*Icon weight="duotone"`; brand GitHub/LinkedIn từ `react-icons/fa6`.
- **HeroUI first**: `ExtendedTabs`, `Card`, `CardContent`, `Button`, `Typography`, `Label`, `Chip`.
- **1 primary action / màn**: nút "Chỉnh sửa hồ sơ" là primary duy nhất ở sidebar.
- **a11y**: contrast ≥4.5 (dùng token), focus ring, touch target ≥44px.
- **i18n**: mọi text qua `next-intl`, thêm key mới vào `messages/vi.json` + `messages/en.json`.

## Loading / empty / error

- Mọi fetch phải qua `AsyncContent`.
- Skeleton mirror layout thật (`ProfileShellSkeleton`, `PersonalSkeleton`, `AcademicSkeleton`).
- Empty state dùng `EmptyContent` block với icon `TrayIcon`.
- Error state dùng `ErrorContent` của `AsyncContent`.

## Web references

- GitHub profile / Threads profile: sidebar identity + card content, underline tabs.
- Udemy profile: avatar + bio + social links, nhưng chúng ta không copy bố cục đơn điệu của họ.
- PublicProfile (starci-academy): 2-col bare identity, rank ring, `LabeledCard`, `ExtendedTabs`.

## Files dự kiến thay đổi

- `src/components/features/profile/ProfileShell/index.tsx`
- `src/components/features/profile/ProfilePersonal/index.tsx`
- `src/components/features/profile/ProfileAcademic/index.tsx`
- `src/components/features/profile/ProfileCommunity/index.tsx`
- `src/components/features/profile/ProfilePortfolio/index.tsx`
- `src/components/features/profile/ProfileProgress/index.tsx`
- `src/messages/vi.json`, `src/messages/en.json`

## Backend delta

Không có. Giữ nguyên hook + mock data, không thêm API.
