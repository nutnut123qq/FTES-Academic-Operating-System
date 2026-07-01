# Landing — handoff (tiếp tục ở máy khác) · 2026-06-26

> Ghi lại trạng thái + việc dở để máy mới `git pull` rồi làm tiếp. Prompt gợi ý ở cuối.

## Hero visual (phần đang lặp nhiều nhất)
- Cột phải hero = block **`MicroservicesScene`** (`src/components/blocks/marketing/MicroservicesScene/index.tsx`).
- **Hiện tại = isometric "mini-infra" bằng SVG thuần** (svc → deployment 3 pods → Postgres 1-node = bottleneck), style theo bộ **`cloud-native-isometric-icons`** (fjudith, Apache-2.0) + Cloudcraft/Stackdraft. StarCi-color: pod focal = accent hồng, node lỗi = danger đỏ, còn lại slate; có flag "single DB → bottleneck" + packet chạy (animateMotion).
- **ĐÃ BỎ three.js / R3F** (thử rồi thầy "thôi dẹp") → deps `three`/`@react-three/fiber`/`@react-three/drei`/`@types/three` đã `npm uninstall`. Import trong Landing là **static** (SVG SSR-safe, không còn `dynamic ssr:false`).
- Lịch sử ý: microservices topology (flat) → 3D blocks → glass → three.js → **isometric mini-infra (chốt)**.

## Việc DỞ / NEXT (ưu tiên)
1. **Verify iso-infra bằng mắt + tune** (chưa soi trên trình duyệt máy này): số lượng component, màu, có thể thêm animate "pod-drop" (pod rơi xuống platform) + nhiều connector hơn. Cân nhắc dùng **asset SVG thật** của `cloud-native-isometric-icons` (Apache-2.0 — cần kèm attribution/NOTICE) nếu muốn chi tiết hơn bản tự vẽ.
2. **`LearnLoopScroll`** đang WIP (trước có lint nits `CaretRightIcon`/`t` unused, `StaticStep`) — kiểm lại cho sạch.
3. **`MicroservicesDiagram`** (block 2D cũ) giờ mồ côi (Landing không import nữa) → xoá nếu chắc không cần revert.
4. Ảnh founder `public/landing/founder.jpg` + Thảo Vân `public/landing/thao-van.jpg` (avatar đã `!rounded-full`).

## Đã xong trong phiên (đừng làm lại)
- Hero copy: eyebrow `From Developer to Solution Architect` · headline "Học **tư duy hệ thống** — không dừng lại ở CRUD" · slogan "Đi từ bản chất, trình từ thực tế — tự tin đối thoại sòng phẳng với mọi Interviewer" · keywords `TypeScript·Java·C#·Go` (bỏ font-mono).
- **Lộ trình**: gộp Courses + Roadmap → 1 section track-card (identity + tier + "Vào khóa" → course thật `fullstack/system-design/devops-mastery`).
- **Stats header**: eyebrow "Số liệu thật" · title "StarCi Academy đang có" · intro "…cập nhật trực tiếp từ hệ thống".
- **Footer** links → `text-foreground` (hover accent).
- **`#` anchor** mỗi section (SectionHeading `anchorId`) + **nút back-to-top FAB** (`Button variant=primary`, góc phải-dưới, hiện sau scroll 600px).
- Sample candidate **Thảo Vân** (TalentMarketplace, avatar tròn).

## Prompt gợi ý cho máy mới
> "Tiếp tục landing StarCi. Hero cột phải = `MicroservicesScene` isometric mini-infra SVG (style cloud-native-isometric-icons), đã bỏ three.js. Mở `localhost:3000/vi` soi iso-infra rồi tune (màu/animate pod-drop/connector), kiểm `LearnLoopScroll`, xoá `MicroservicesDiagram` cũ nếu chắc. Refs: github.com/fjudith/cloud-native-isometric-icons, cloudcraft.co, stackdraft.io. Áp `/fe` + design tokens; commit khi xong."
