# Tasks — locked-login-appeal

- [x] 1.1 `SignInState.Locked` + `lockInfo` (+ `setLockInfo`) trong store sign-in
- [x] 1.2 `readAccountLockedPayload` đọc `data` của 423 phòng thủ + test
- [x] 1.3 `submitUnlockAppeal` (`POST /auth/appeals`, `authenticated: false`) + `usePostUnlockAppealSwr`
- [x] 1.4 `LockedState`: lý do · thời điểm · tag vi phạm · form đơn · trạng thái đã gửi/đang chờ
- [x] 1.5 Mount vào `SignInSection`; `useSignInForm` bắt 423 → chuyển bước
- [x] 1.6 i18n vi/en
- [x] 2.1 `tsc --noEmit` sạch · eslint sạch · `npm test` 1117 test xanh
