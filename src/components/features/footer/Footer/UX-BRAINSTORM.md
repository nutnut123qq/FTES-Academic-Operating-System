# Footer — UX Brainstorm (global site footer)

> Brainstorm cho 1 GLOBAL footer StarCi Academy. Hiện CHƯA có footer nào (grep `*footer*` = 0). Landing kết ở closing CTA "Đừng xây CRUD nữa → Xem khóa học" rồi hết trang. KHÔNG code ở bước này — chốt hướng xong mới `/starci-fe-ux-apply`.
> Repo FE: `C:\Repositories\starci-academy` (main). Ngày: 2026-06-26.

## Mục tiêu của footer (job-to-be-done)
- **Không phải** 1 sitemap doanh nghiệp. StarCi là sản phẩm **early-stage, 1 founder dựng** (trang Liên hệ tự nói "StarCi is built by one person"). Footer phải thiết kế cho **dữ liệu THẬT đang có** (ít route public, ít legal page) — KHÔNG vẽ 5 cột link rỗng kiểu corp (ref [[design-for-data-that-exists-coverless-lowvolume]], design-restraint, vanity-cut).
- 3 việc footer thật sự cần làm: (1) **điều hướng phụ** tới vài trang public chính (khi user cuộn hết trang); (2) **chốt thương hiệu** (logo + 1 câu manifesto giữ đúng giọng editorial "Đừng xây CRUD"); (3) **tin cậy + chạm được** (social + email founder + copyright). 
- **KHÔNG lặp 1 CTA bự** — section closing ngay phía trên đã là CTA "Xem khóa học". Footer là utility/brand/trust, không phải CTA thứ 2 (tránh 2 CTA dính nhau).

## Dữ liệu THẬT có sẵn (grounded)
| Cần | Nguồn | Giá trị thật |
|---|---|---|
| Route public | `src/resources/path/index.ts` `pathConfig().locale(l)` | home `.build()` · courses `.course().build()` · contact `.contact().build()` · blog `.blog().build()` · community `.community().build()` · talents `.talents().build()` |
| Route AUTH-only (CẨN THẬN) | path | dashboard · practice · review(flashcards) · league · profile/settings → **guest bấm sẽ vào login wall** → KHÔNG nên để ở footer public, hoặc chỉ hiện khi đã đăng nhập |
| Nav header (mirror) | `features/navbar/Navbar/NavLinks` | chỉ 3: `nav.home` · `nav.courses` · `nav.contact` |
| Contact/social | `features/contact/Contact/constants.ts` | `CONTACT_EMAIL=cuongnvtse160875@gmail.com` · `CONTACT_PHONE=0828678897` (`+84828678897`) · `FOUNDER_FACEBOOK/LINKEDIN/GITHUB` (.../starci183) · giờ hỗ trợ T2–T6 9:00–18:00 |
| Founder | i18n `contact.founder.name` | "Stacy Nguyen" · "Founder · StarCi Academy" |
| Brand | `blocks/identity/BrandLogo` + `/logo-icon.png` | flame + "StarCi" / "academy" |
| Tagline | `src/config/seo.ts` defaultDescription + landing closing | "Đọc → thử thách chấm AI → capstone…" |
| Token | `globals.css` | `--accent` pink oklch hue 354 · `--background/surface/foreground/muted/border/separator` · dark default · card = border, no shadow |
| i18n | `messages/{vi,en}.json` | **CHƯA có `footer.*`** → tạo mới |
| Placement | `src/app/InnerLayout.tsx` | footer = sibling của `<Navbar/>`, sau `{children}` |

## 3 hướng (xem widget mockup)
### A — Editorial minimal ★ (CHỐT)
- Trái: BrandLogo + 1 câu manifesto (giọng editorial) + 3 social icon. Phải: 2 cột link gọn ("Khám phá": Khóa học · Blog · Talents · Cộng đồng | "Hỗ trợ": Liên hệ · email). Bottom bar: `© 2026 StarCi Academy · Dựng bởi Stacy Nguyen` + (ngôn ngữ · Điều khoản · Bảo mật nếu có).
- **Vì sao chốt:** khớp giọng thương hiệu + design-restraint + dữ liệu thật (ít route, solo). Gói được trust (social + "made by Stacy" + email) mà KHÔNG giả làm corp sitemap, KHÔNG lặp trang Liên hệ. Ref: NN/g + UXPin "footer = phần mở rộng tự nhiên của site, tối giản essentials"; Linear/Vercel minimal footer.
### B — Sitemap utility
- 4 cột (Khóa học/Học tập/Công ty/Kết nối) + copyright. **Loại:** nhiều cột → với solo product là **padding/vanity**; nhiều link AUTH-only (Practice/League/Flashcards) → guest đụng login wall; mất chất riêng. Chỉ hợp khi app có nhiều trang marketing public.
### C — Founder-direct
- Đẩy "chạm thẳng founder" (mini-strip Stacy + email/phone/giờ + social) + link gọn. **Loại làm mặc định:** trùng nhiều với trang Liên hệ (email/phone/giờ đã ở đó) → footer nặng. **Giữ ý hay:** dòng "Dựng bởi Stacy Nguyen" + social → đã fold vào A.

## Section → dữ liệu (hướng A)
| Section | Nội dung | Nguồn |
|---|---|---|
| Brand | logo + manifesto | BrandLogo + i18n `footer.tagline` |
| Social | FB · LinkedIn · GitHub (icon phosphor, isExternal) | constants FOUNDER_* |
| Khám phá | Khóa học · Blog · Talents · Cộng đồng | pathConfig (public) |
| Hỗ trợ | Liên hệ · email (mailto) | pathConfig.contact + CONTACT_EMAIL |
| Bottom bar | copyright + "Dựng bởi Stacy Nguyen" + lang? + legal? | i18n `footer.copyright/madeBy` |

## Cắt / Thêm
- **CẮT:** cột link AUTH-only (dashboard/practice/league/flashcards) khỏi footer public; CTA bự (đã có ở closing); newsletter (app CHƯA có mailing-list capability → đừng vẽ UI cho thứ không tồn tại); phone/giờ-hỗ-trợ (để ở trang Liên hệ, footer chỉ email cho gọn).
- **THÊM (mới):** key i18n `footer.*` (vi+en); component `features/footer/Footer` render qua `InnerLayout` (sibling Navbar).

## States / a11y / responsive
- Footer tĩnh, không async → không cần loading/empty/error.
- Mobile: 2 cột link xuống dưới brand (stack 1 cột), social giữ hàng ngang; bottom bar wrap. Touch target ≥ 44px, font ≥ 13px.
- `<footer>` landmark; social icon-only → `aria-label`; link external `rel`/isExternal; hover `text-muted → text-foreground` (mọi link interactive có hover — [[interactive-needs-hover]]). KHÔNG emoji, KHÔNG uppercase (trừ wordmark "academy" của BrandLogo sẵn có), icon phosphor.
- Card: footer là 1 band PHẲNG (border-top phân tách với trang), KHÔNG bọc card / không 2 card dính ([[concepts/card]], [[whitespace-over-dividers]]).

## QUYẾT ĐỊNH (đã chốt 2026-06-26)
1. **Hướng = A · Editorial minimal.** ✅
2. **Legal = TẠO 2 TRANG STUB.** ✅ Dựng `/[locale]/terms` (Điều khoản) + `/[locale]/privacy` (Bảo mật) tối giản (PageHeader + nội dung placeholder/khung), thêm `pathConfig().locale().terms()/privacy()`, footer link tới 2 trang thật (KHÔNG link chết). → scope apply gồm: footer + 2 trang stub + path methods + i18n.
3. **Ẩn footer ở:** mọi trang TRỪ `/learn/*` (reader app-shell) và `/authentication/*`. ✅ (gate trong InnerLayout theo pathname).
4. **Ngôn ngữ/theme:** BỎ khỏi footer (navbar đã có). ✅ Bottom bar chỉ: copyright + "Dựng bởi Stacy Nguyen" + Điều khoản + Bảo mật.
5. **Global toàn site** qua `InnerLayout` (sibling Navbar). ✅

## Scope cho `/starci-fe-ux-apply`
- `features/footer/Footer` (hướng A) + sub-components (link column, social row) — style chỉ ở block/feature, dùng token.
- Gate render footer trong `InnerLayout` (`!isLearnRoute && !isAuthRoute`).
- 2 trang stub: route `app/[locale]/terms/page.tsx` + `privacy/page.tsx` + feature tối giản (PageHeader + body placeholder), `pathConfig` thêm `.terms()/.privacy()`.
- i18n `footer.*` (vi+en): tagline, các nhãn cột (Khám phá/Hỗ trợ), link labels, copyright, madeBy, terms, privacy + `legal.*` cho 2 trang stub.
- Mirror responsive + a11y như mục trên. tsc + eslint sạch.

## Refs
- NN/g-style footer guidance: UXPin footer best practices · Eleken footer UX patterns 2026 · LogRocket footer design.
- "footer = phần mở rộng tự nhiên, tối giản essentials, 1 identity" (minimal dev/edu footer). Exemplar tinh thần: Linear/Vercel.
