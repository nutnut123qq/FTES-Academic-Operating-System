# Night-run queue

Batch có giới hạn cho phiên chạy qua đêm. Mỗi mục = 1 OpenSpec change (propose → apply → archive),
verify (`npm run build` webpack + tsc) trước khi commit, 1 change = 1 commit.

Thứ tự (Phase 0 → bắt đầu §3). Loop lấy mục `[ ]` trên cùng, làm xong tick `[x]`.

- [ ] `phase0-auth-complete` — §1: Đăng ký, OTP email/SĐT, 2FA, Forgot/Reset password, Remember, Captcha (FE + mock BE)
- [ ] `phase0-rbac` — §1: Role/Permission model + route/UI guards (Moderator/Admin/Super Admin)
- [ ] `phase0-account-security` — §1: Device Management, Active Sessions, Login History, Trusted Devices, Security Log
- [ ] `phase0-academic-profile` — §2: Personal (avatar/cover/bio/social) + Academic (university/campus/major/semester/GPA) + Portfolio
- [ ] `subject-workspace-core` — §3: khung Subject Workspace (Overview/Learning/Resources/Community/Practice/AI/Members/Stats/Career Bridge), tabs + shell

## Guardrails (loop tuân thủ)
- Build đỏ → `git restore` change đó, ghi log, KHÔNG commit rác.
- 2 lần build đỏ liên tiếp → DỪNG loop, để lại báo cáo.
- OpenSpec thiếu ngữ cảnh → tự quyết hợp lý + ghi giả định vào báo cáo (không chặn chờ).
- Thiếu contract BE → mock/placeholder, ghi giả định. KHÔNG push/deploy.
- Mỗi vòng: cập nhật `docs/NIGHT-RUN-<ngày>.md` (đã xong / commit / giả định / fail).
