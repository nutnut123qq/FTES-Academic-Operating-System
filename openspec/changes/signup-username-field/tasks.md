# Tasks — signup-username-field

## 1. Component trường username
- [x] 1.1 `RegistrationState/UsernameField/index.tsx` (mới): mirror `EmailField/` — HeroUI
      `TextField`/`Label`/`Input`/`FieldError`, `type="text"` không `required`, dòng helper muted
      + `aria-describedby`, i18n `auth.signUp.username.*`

## 2. Store
- [x] 2.1 `store.ts`: thêm `username: ""` vào state + `initialState` + `touched`
- [x] 2.2 `store.ts`: thêm `"username"` vào union `SignUpField` và union field-name của `setValue`
- [x] 2.3 `store.ts`: bỏ comment gây hiểu nhầm "Email (also the username)"

## 3. Hook submit
- [x] 3.1 `useSignUpForm.ts`: select `username` từ store + thêm vào `values`
- [x] 3.2 `useSignUpForm.ts`: validate `username` CHỈ khi khác rỗng (3–64 ký tự, `^[a-zA-Z0-9._-]+$`);
      rỗng = hợp lệ
- [x] 3.3 `useSignUpForm.ts`: thêm `"username"` vào guard `setFieldTouched`
- [x] 3.4 `useSignUpForm.ts`: payload gửi `username` (trim + lower-case) khi có, `undefined` khi rỗng

## 4. Render
- [x] 4.1 `RegistrationState/index.tsx`: import + callbacks (`onChangeUsername`/`onBlurUsername`) +
      render `<UsernameField>` sau Email, trước Password

## 5. i18n
- [x] 5.1 `messages/vi.json`: thêm `auth.signUp.username` (label/placeholder/helper/minLength/maxLength/invalid)
- [x] 5.2 `messages/en.json`: mirror cùng key + thứ tự

## 6. Verify
- [x] 6.1 `tsc --noEmit` sạch (EXIT 0)
- [x] 6.2 eslint 4 file chạm sạch (EXIT 0)
- [x] 6.3 JSON vi/en hợp lệ (parse OK)
- [x] 6.4 Không có test trực tiếp cho hook/form (grep xác nhận) → dựa Vercel CI build
