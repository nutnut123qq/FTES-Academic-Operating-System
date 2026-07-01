# Single-flight refresh token — giải thích logic

> File: `src/modules/api/graphql/clients/links/refresh-token/mutation.ts`
> Mục tiêu: gom nhiều `refreshToken` song song thành **1** request → hết spam + hết `CSRF token mismatch`.

---

## 1. Vấn đề

[`proactive-access-token-refresh-link`](../src/modules/api/graphql/clients/links/proactive-access-token-refresh-link.ts)
chạy **trước MỖI operation**: nếu access token sắp hết hạn → `await mutateRefreshToken()` rồi mới cho request đi.

Nên khi app bắn **N query cùng lúc** lúc token gần hết hạn:

```
query1 ─┐
query2 ─┤
query3 ─┼─► mỗi đứa tự gọi refreshToken  ⇒  N request refresh SONG SONG
query4 ─┤
query5 ─┘
```

Hậu quả:
- **Spam**: N request refresh thay vì 1.
- **`CSRF token mismatch`**: BE rotate (đổi) CSRF cookie mỗi lần refresh. N refresh đua nhau → cookie bị đổi "dưới chân" các refresh anh em → header (token cũ) ≠ cookie (token mới) → BE chặn.

---

## 2. Cách sửa — single-flight (request coalescing)

```ts
// promise của refresh ĐANG bay (null nếu đang rảnh)
let inFlightRefresh = null

const sendRefreshToken = (params) => {
    // tạo client throwaway + gọi mutation thật (network)
    const apollo = createRefreshTokenApolloClient({ ... })
    return apollo.mutate({ ... })
}

export const mutateRefreshToken = (params) => {
    if (inFlightRefresh) return inFlightRefresh                  // (A) ăn ké cái đang chạy
    inFlightRefresh = sendRefreshToken(params)                  // (B) chưa có → bắn 1 cái thật
                        .finally(() => { inFlightRefresh = null })  // (C) xong thì dọn cờ
    return inFlightRefresh
}
```

**Mấu chốt JS:** 1 `Promise` có thể được `await` bởi nhiều nơi cùng lúc — tất cả nhận **cùng 1 kết quả**, KHÔNG chạy lại.

---

## 3. Timeline khi 5 query bắn đồng thời

```
t0  query1 → mutateRefreshToken: inFlightRefresh == null
              → (B) tạo PROMISE_X, GÁN vào biến ngay (đồng bộ), return PROMISE_X
t0  query2 → inFlightRefresh == PROMISE_X (≠ null) → (A) return luôn PROMISE_X
t0  query3 → (A) return PROMISE_X
t0  query4 → (A) return PROMISE_X
t0  query5 → (A) return PROMISE_X
              │
              └─► cả 5 cùng await PROMISE_X  ⇒  CHỈ 1 network refresh

t1  refresh xong → PROMISE_X resolve → cả 5 cùng nhận accessToken mới
t1  .finally → inFlightRefresh = null   (mở đường cho lần hết hạn sau)
```

So sánh:

| | Không single-flight | Có single-flight |
|---|---|---|
| Số request refresh | N (mỗi query 1 cái) | **1** |
| CSRF rotate đè nhau | Có → mismatch | Không |

---

## 4. Vì sao từng dòng

- **(A) `if (inFlightRefresh) return inFlightRefresh`** — đang có refresh chạy thì **nhập bọn**, không tạo cái mới. Chỗ "gom".
- **(B) `inFlightRefresh = sendRefreshToken(params)`** — **gán promise vào biến NGAY** (đồng bộ, trước khi `await`). Nhờ vậy query2..5 ở cùng tick thấy nó `≠ null`. Đây là lý do cơ chế chạy được: gán xong trước khi network kịp xong.
- **(C) `.finally(() => inFlightRefresh = null)`** — refresh settle (thành công **hoặc** lỗi) → trả biến về `null`, để lần token hết hạn **sau** lại refresh được. Không dọn → kẹt mãi 1 token.

---

## 5. Vì sao chỉ dedup "đang bay", không cache kết quả lâu hơn

Sau khi refresh xong, token mới đã lưu. Proactive link tự check `shouldRefreshAccessTokenBeforeRequest`:
thấy token còn tươi → **skip refresh**. Nên chỉ cần chặn lúc *chồng nhau*; xong là thả ra.

Nếu cache kết quả cũ quá lâu → có lúc trả token đã hết hạn → sai.

---

## 6. Lưu ý / trade-off

- Nếu caller đầu tiên truyền `signal` (AbortSignal) rồi abort → refresh chung abort cho cả nhóm.
  Thực tế caller chính (proactive link) **không** truyền signal nên an toàn.
- Nếu refresh **lỗi/reject** → cả nhóm cùng nhận lỗi (đúng — không che giấu), và `finally` reset cờ → lần sau retry được.
- BE vẫn rotate CSRF mỗi refresh, nhưng giờ không còn 2 refresh chồng nên không sao.
  Muốn chắc cú hơn nữa có thể bỏ rotate ở BE `refresh-token.resolver.ts` (optional).

---

**Một câu:** *"Trong khi 1 thằng đang refresh, mọi thằng khác xếp hàng ăn ké kết quả của nó; refresh xong thì xoá hàng đợi."*
