## 1. Sơ đồ tư duy dùng tín hiệu quyền thật

- [x] 1.1 `MindMap.statusOf`: `isPremium` → `isLocked`; học phần chỉ "khoá" khi MỌI bài đều khoá.
      (verify: statusOf dùng `module.lessons.every(l => l.isLocked)`, doc ghi rõ "NOT isPremium".)
- [x] 1.2 `MindMap.openModule`: vào bài đầu tiên có `accessLevel !== "NONE"`; khoá hết thì mở
      `PackageGateModal` (như `ContentMap`), không `router.push` vào bài khoá.
      (verify: openModule dùng `find(isOpenable)`; không có bài mở → setGateModule → PackageGateModal.)
- [x] 1.3 Copy `learn.mindMap.legend.locked` bỏ "Cần nâng cấp"/"Upgrade needed" (luật
      `premium-unlock-is-enroll-not-vip`), vi + en. (verify: legend.locked = "Chưa mở"/"Locked";
      grep "Cần nâng cấp"/"Upgrade needed" = 0 hit toàn messages.)

## 2. Video xem thử không phụ thuộc trường theo người xem

- [x] 2.1 `FlatLesson` thêm `previewSeconds`; `hasVideo` thêm nhánh `previewSeconds > 0`.
      (verify: hook map `previewSeconds`, `hasVideo` nhánh `accessLevel==="PREVIEW" || previewSeconds>0`;
      10/10 vitest xanh MindMap+PackageGateModal+hook.)

## 3. Cổng gói không loại gói miễn phí

- [x] 3.1 `PackageGateModal`: bỏ điều kiện `Number(pkg.salePrice) > 0` khi lọc.

## 4. Verify

- [x] 4.1 `npx tsc --noEmit` sạch (không output, exit 0).
- [x] 4.2 Test mới cho từng hành vi, ĐÃ kiểm bằng cách gỡ CẢ BA fix cùng lúc cho ĐỎ trước rồi khôi
      phục. Gỡ fix → **4/10 đỏ**, mỗi cái đúng lỗi nó canh:
      - `MindMap > does not grey out premium modules for a learner who already owns them`
        → `expected 'fill-separator stroke-accent opacity-…' to contain 'fill-default'`
      - `MindMap > keeps a module open-looking when at least one lesson is unlocked`
        → `expected 'fill-separator …' not to contain 'fill-separator'`
      - `useQueryLearnLessonSwr > mounts the video block for a viewer with no accessLevel when a
        preview window exists` → `expected false to be true`
      - `PackageGateModal > lists a FREE package that unlocks the lesson instead of upselling the
        whole course` → `Unable to find an element with the text: Gói tặng kèm`
      Khôi phục fix → **10/10 xanh** (3 test file).
- [x] 4.3 `npm run build` (webpack) xanh.
