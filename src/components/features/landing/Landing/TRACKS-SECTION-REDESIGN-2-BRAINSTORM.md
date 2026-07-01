# Section "Lộ trình" (Ba lộ trình. Một tư duy.) — vẽ lại (vòng 2)

> `/starci-fe-ux-brainstorm` (2026-06-26). KHÔNG code. Hiện dùng `RoadmapMetro` (3 dây metro ngang xếp dọc) → thầy: *"khó nhìn quá, render 3 card cũng được, hoặc concept scroll tại 1 trang"*.

## Pain (RoadmapMetro hiện tại)
- 3 dây metro ngang xếp dọc + 12 ô chữ topic dày đặc → mật độ chữ cao nhưng layout sparse (nhiều khoảng trống dây).
- Header tier ("1·Foundation … 4·Application") nằm 1 hàng TRÊN, cách xa 3 hàng nội dung → mắt phải bắc cầu xa để map cột↔ô.
- Dấu chấm + dây = trang trí nhưng không thêm nghĩa; topic mới là thông tin → bị dây làm loãng.
- → khó quét "track này gồm gì" lẫn "tier này 3 track khác nhau ra sao".

## Data (grounded, 3 track THẬT)
| Track | màu | module | tiers (Foundation→Application) |
|---|---|---|---|
| Fullstack thực chiến | pink/accent | 23 | HTTP·REST·data → Auth·caching·jobs → Queues·websockets·rate-limit → Deploy·observability·payments |
| Hệ thống phân tán | green/success | 24 | Latency·CAP → Sharding·replication·indexes → Consensus·idempotency·sagas → Real systems e2e |
| Triển khai & Vận hành | amber/warning | 35 | Linux·containers·net → CI/CD·IaC·secrets → K8s·autoscaling·SLO → Progressive delivery·DR |
- Mỗi track: icon · title · "N module · 20 hệ thống" · "Vào khóa" → course thật (`LANDING_TRACK_COURSE_SLUG`). Tiers từ `LANDING_ROADMAP_TIERS`.

## 3 hướng (xem widget)
### ★ A — 3 card track, path 4 tier DỌC (ĐỀ XUẤT)
- Mỗi track = 1 card bounded: header (icon+title+meta) · 4 tier xếp **dọc** (dot màu track + nhãn tier nhỏ + topic) · footer "Vào khóa →".
- 3 card cạnh nhau (lg, `gap-6`) / stack (mobile). Mỗi card tự gói → quét 1 track 1 mạch dọc; 3 card cạnh nhau vẫn so được; "một tư duy" đọc ra vì cả 3 card cùng cấu trúc 4 tier.
- **Vì sao chọn:** legibility cao nhất + đúng cái thầy gợi ("render 3 card") + KHÔNG thêm 1 section scroll-pinned thứ 2 (đã có LearnLoop) + KHÔNG bảng cuộn-ngang trên mobile. Ref [[landing-render-track-not-course-catalog]] (track=course→1 card identity+tier+CTA) + [[concepts/card]] (3 card siblings ngang `gap-6` OK, không phải 2 card bordered chồng dọc).
- Trade-off: lặp 4 nhãn tier 3 lần (mỗi card) — chấp nhận, vì nhãn nhỏ/muted, topic mới là nội dung; đây là cái [[shared-axis-matrix]] muốn tránh nhưng card dễ đọc hơn matrix.

### B — scroll-pinned switcher (như LearnLoop)
- Ghim section: trái = list 3 track, phải = path track đang chọn (to). Cuộn → đổi track.
- Mỗi track full không gian → rất rõ. NHƯNG: là **section pinned THỨ 2** ngay sau LearnLoop (2 lần scroll-jack liên tiếp = nặng, dễ ngán) + chỉ thấy 1 track/lúc (mất so sánh). → KHÔNG nên cho section "so 3 lộ trình".

### C — ma trận tier (HeroUI Table, trục chung 1 lần)
- 4 cột tier (hiện 1 lần) × 3 hàng track; hàng-header = identity+CTA. "Một tư duy" = trục cột literal. Ref [[shared-axis-matrix-heroui-table]].
- Compact + so tốt theo tier. Nhược: mobile cuộn-ngang, dày chữ (giống pain hiện tại ở mật độ). Là cái metro đáng lẽ thay — nhưng vẫn nặng chữ.

## Chốt đề xuất: **A** (3 card path dọc)
Dễ đọc nhất, hợp gợi ý của thầy, không đẻ thêm scroll-pin, mobile stack đẹp. Giữ "một tư duy" qua cấu trúc 4-tier đồng nhất 3 card. Nếu thầy ưu tiên "so theo tier" hơn "đọc từng track" → C; nếu muốn wow-motion → B.

## ĐÃ ÁP DỤNG 2026-06-26 (Hướng A)
- Block mới `blocks/marketing/TrackCard` (Card identity header + vertical 4-tier path dot/line theo `TrackColor` accent/success/warning + CTA "Vào khóa →"). `Landing` thay `RoadmapMetro` → grid `md:grid-cols-3 gap-6` map `LANDING_COURSE_TRACKS` → `TrackCard` (tiers = `LANDING_ROADMAP_TIERS[key]`, CTA → course thật). Gỡ import `RoadmapMetro` (block giữ lại, hiện mồ côi — nợ xoá). tsc/eslint sạch, landing 200.

## Bước sau (apply)
`/starci-fe-ux-apply`: thay `RoadmapMetro` bằng 3 `TrackCard` (hoặc tái dùng PitchCard mở rộng): grid 3 cột `gap-6` (mobile 1 cột) · mỗi card header+vertical tier path+CTA · màu dot theo track · CTA → course. Bỏ block `RoadmapMetro` nếu không nơi khác dùng. Header section→content giữ `gap-24`.
