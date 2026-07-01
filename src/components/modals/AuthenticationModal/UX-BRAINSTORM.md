# AuthenticationModal — UX brainstorm (2026-06-24)

> KHÔNG code — brainstorm + chốt hướng. MAX effort. Target: `components/modals/AuthenticationModal/**`.

## Inventory hiện tại
- `Modal size="xs"` · tab SignIn/SignUp (Redux `authenticationModalTab`).
- SignIn → `CredentialsState`: title+desc (center) → OAuth (Google+GitHub) → separator "hoặc" → Email → Password → RememberMe + "Quên mật khẩu?" → Turnstile captcha → Submit → SignUpPrompt. Bước 2 = `OtpState`.
- SignUp → `RegistrationState` → `OtpState`.
- **Nhịp dọc bằng ~8 `<div className="h-3" />` spacer TAY** (không flex gap).

## Dữ liệu THẬT (BE)
- REST Keycloak: `POST /keycloak-auth/login` (username+password) · `/register` (email,password,username?,firstName?,lastName?) · OAuth `github-oauth|google` redirect+callback (redirect flow). OTP/reset đi qua Keycloak realm (chưa thấy REST riêng).
- GraphQL `me -> UserEntity` (displayName, avatar, githubUsername, email…) · `connectGithubAccount(githubUsername)`.

## Pain
1. **Spacer tay `h-3` ×8** — brittle, nên `flex flex-col gap-3` ở body (đồng nhịp). (Engineering smell.)
2. **Nhiều field stack 1 lúc** (email+password+remember+captcha+submit) → cao; "giảm field = +conversion".
3. **OAuth chìm ngang hàng** email — với audience DEV, **GitHub là đường nhanh nhất** (77% chuộng social) → nên ưu tiên thị giác.
4. OTP state mơ hồ vai trò (2FA? verify signup?) — cần nhãn rõ.

## Refs ngành
- [Authgear — Login/Signup UX 2025](https://www.authgear.com/post/login-signup-ux-guide/): stepped (email→password), giảm field (4→3 = +50% conversion), social-first.
- [Clerk social login](https://clerk.com/articles/how-do-i-implement-social-login-for-my-web-app) · [Descope social login](https://www.descope.com/learn/post/social-login): 77% chuộng social; **redirect flow** (không popup) cho web.
- Pinterest centered modal (email-first stepped) · [UX Collective login a11y](https://uxdesign.cc/building-better-logins-a-ux-and-accessibility-guide-for-developers-9bb356f0a132).

## Hướng
- **A — Stepped email-first:** nhập email → bước 2 password/OTP. Giảm field, modern (Pinterest/Authgear). NHƯNG đổi luồng formik hiện tại (rủi ro).
- **B — Polish-only:** giữ combined 1 màn, chỉ fix spacer + trust. Ít rủi ro nhất, nhưng không nâng OAuth.
- **C — OAuth-primary single-screen (CHỐT):** OAuth (GitHub+Google) **lên trên, nổi** → separator "hoặc dùng email" → email/password (hạ ưu tiên) → forgot + submit. Bỏ spacer tay → `flex gap-3`. Thêm 1 dòng trust ("bảo mật bởi Keycloak"), captcha chỉ khi bật. Giữ luồng formik + OtpState. Audience dev → GitHub-first đòn bẩy cao nhất, rủi ro thấp (không đổi state machine).

## Section → data
| Section | Field/route | Ghi chú |
|---|---|---|
| Tab SignIn/SignUp | Redux `authenticationModalTab` | giữ |
| OAuth buttons | `keycloakRedirect.github/.google` (redirect flow) | nhãn "Tiếp tục với GitHub/Google" |
| Email/Password | `useSignInForm` → `/keycloak-auth/login` | hạ ưu tiên dưới separator |
| Forgot password | Keycloak realm reset | link nhỏ phải |
| OTP step | `OtpState` | giữ; nhãn rõ mục đích |
| Trust row | tĩnh | "bảo mật bởi Keycloak" |

## Cắt / thêm
- **Cắt:** ~8 `<div h-3/>` (→ flex gap); bố cục stack đều tăm tắp.
- **Thêm:** OAuth nổi lên trên · trust row · nhãn redirect. KHÔNG đổi BE.
- **Hỏi thầy:** có muốn stepped (hướng A, v2) để giảm field không, hay giữ combined (C).

→ Widget đã vẽ trong chat. CHỐT hướng → `/starci-fe-ux-apply`.
