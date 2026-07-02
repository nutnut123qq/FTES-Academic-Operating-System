## Context

Trang `/courses` (CourseCatalog) và category page render `CatalogCourseCard` (feature family `features/course/browse`, bound mock `Course` từ `useQueryCoursesSwr`). Card là 1 `Link` full-surface → course detail; đã có `SaveButton` (wishlist) swallow press. HeroUI có `Popover` (đã dùng nhiều nơi: StreakPopover, NotificationBell…) nhưng Popover của react-aria là **click/press-triggered**, không phải hover-triggered — hover card preview (kiểu Udemy) cần open/close theo pointer enter/leave với delay + giữ mở khi pointer vào popup.

## Goals / Non-Goals

**Goals:**
- Hover preview popover cạnh card, desktop-only, delay ~300ms, flip trái/phải theo viewport, pointer di vào popup không đóng.
- Reuse tối đa: `SaveButton`, `Chip`, `Typography`, `Button` HeroUI; không dependency mới.
- Degrade an toàn khi thiếu field; i18n vi+en.

**Non-Goals:**
- Không đụng `blocks/cards/CourseCard` (GraphQL entity card).
- Không BE/API mới — mở rộng mock.
- Không hover preview trên mobile/touch; không "tap lần 1 mở preview, tap lần 2 điều hướng".
- Không add-to-cart thật (chưa có giỏ hàng) — CTA = enroll/điều hướng detail.

## Decisions

1. **Component mới `CourseHoverPreview` trong `features/course/browse/`** bọc children (card) — card giữ nguyên, wrapper gắn hover handlers + render popup. Alternative: nhét vào trong `CatalogCourseCard` — bị loại vì card đang là `<Link>` full-surface, popup chứa interactive elements (CTA, SaveButton) không được nằm trong `<a>` (nested interactive, invalid HTML).
2. **Hand-rolled hover popup (absolute-positioned panel), KHÔNG HeroUI Popover.** HeroUI/react-aria Popover là press-triggered + focus-trap semantics — sai interaction model cho hover preview; ép nó thành hover là fight framework. Panel tự render: `absolute top-1/2 -translate-y-1/2` + `left-full`/`right-full`, `z-40`, chỉ mount khi open. Đây là **preview bổ trợ** (mọi nội dung/hành động đều có trên trang detail) nên không cần dialog semantics — `aria-hidden` là đủ, giống tooltip giàu nội dung.
3. **Open/close state = local `useState` + `setTimeout` delay (~300ms mở, ~100ms đóng)**, `onPointerEnter`/`onPointerLeave` trên wrapper bao CẢ card lẫn panel → di chuột từ card sang panel không đóng (leave wrapper mới đóng). Clear timers on unmount.
4. **Flip side bằng đo viewport lúc mở:** khi open, đo `getBoundingClientRect()` của wrapper — đủ chỗ bên phải (`rect.right + PANEL_W < innerWidth`) → mở phải, ngược lại mở trái. `// ponytail:` đo 1 lần lúc mở, không track resize/scroll (hover preview sống ngắn).
5. **Desktop-only gate = CSS `hidden [@media(hover:hover)_and_(pointer:fine)]:block`** trên panel wrapper + không gắn handler tác dụng phụ trên touch (pointer events không fire hover trên touch một cách đáng tin — CSS gate là chốt chặn chính). Native CSS trước JS (`matchMedia`) — rung ít hơn, SSR-safe.
6. **Mock data:** thêm `description?`, `learnOutcomes?: string[]`, `updatedAt?: string` vào `Course` + seed cho 10 course mock. Giả định ghi rõ trong JSDoc: BE course list endpoint sẽ trả các field này.
7. **CTA:** `Button` primary "Đăng ký khóa học" → `router.push(/courses/{id})` (enroll flow sống ở detail — theo luật premium-unlock-is-enroll-not-vip) + `SaveButton` cạnh (icon wishlist). Không nút "Add to cart" vì chưa có giỏ hàng.

## Risks / Trade-offs

- [Panel bị clip bởi ancestor `overflow-hidden` (CategoryShelf carousel là scroll container)] → panel absolute trong wrapper vẫn bị clip bởi shelf `overflow-x-auto`. Mitigation: kiểm tra thực tế trên shelf; nếu clip, render panel qua `createPortal(document.body)` + `position: fixed` tại rect của card (pattern đã dùng ở ContentAiSelectionAsk). Grid view (category page / filtered) không clip.
- [Hover preview che card kế bên] → chấp nhận (Udemy cũng vậy); đóng nhanh khi leave.
- [Đo flip 1 lần lúc mở, không re-position khi scroll] → hover + scroll đồng thời hiếm; popup đóng khi pointer rời card.

## Migration Plan

FE-only, additive. Rollback = revert commit.

## Open Questions

- Panel có bị shelf carousel clip không → quyết portal hay absolute khi implement (task đầu tiên verify).
