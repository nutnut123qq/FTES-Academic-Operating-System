# RUNBOOK — chẩn đoán quest cộng đồng không cộng XP

Dành cho người **có tay trên hạ tầng** (docker + psql + Kafka). Không có gì ở đây sửa được từ
repo FE; đây là cách CHỐT nguyên nhân bằng bằng chứng runtime thay vì suy luận.

**Triệu chứng người dùng báo:** đăng bài / viết bình luận trong Cộng đồng, quest hằng ngày
(`COMMUNITY_POST`, `COMMUNITY_COMMENT`) không nhích, XP không cộng.

**Đường ống đầy đủ:** `FTES-AOS-Community` ghi bảng `community.outbox` trong cùng transaction
nghiệp vụ → `CommunityOutboxRelay` đọc outbox, đẩy lên Kafka topic `ftes.activity.events` →
worker của `FTES-AOS-Backend` (`GamificationEventProcessor`) tiêu thụ, cộng XP và nhích
`gamification.quest_progress`.

---

## 0. Nghi phạm số 1 (đã tìm ra khi đọc code, CHƯA xác nhận runtime)

`CommunityOutboxRelay`
(`FTES-AOS-Community/src/main/java/vn/ftes/aos/community/event/CommunityOutboxRelay.java:23`)
đòi profile Spring **`worker`**, mà **không file nào trong cả 4 repo bật profile đó** cho
service Community.

- Cổng thứ hai `ftes.runtime.consumers-enabled` (dòng 34) mặc định **TRUE**
  (`application.yml:102`) nên không phân biệt được api/worker ⇒ `@Profile("worker")` là cổng
  DUY NHẤT còn tác dụng.
- Cổng đó **không** được nhắc trong javadoc của chính class (dòng 25), **không** được nhắc
  trong commit tạo ra nó (`a150dc5`), **không** có `application-worker.yml`, **không** có trong
  Dockerfile, **không** có trong runbook, và bản tham chiếu được viện dẫn (Workspace) hoàn toàn
  không dùng `@Profile`.
- Container `svc-community-worker` CÓ thật (`deploy-apitest.yml:31`, commit `1dbef79`) nhưng
  chỉ được định nghĩa trong `docker-compose.local.yml` — **bị gitignore**
  (`FTES-AOS-Backend/.gitignore:17`) — nên repo **không chứng minh được** host có set profile
  hay không.

Kết luận từ code: đây chắc chắn là **lỗi thiết kế cấu hình** (một cổng bắt buộc, câm, mâu thuẫn
tài liệu, không kích hoạt được từ git). Còn "nó ĐANG chặn quest hay không" thì phải chạy lệnh ở
dưới mới biết.

## 0b. Những thứ ĐÃ KIỂM và SẠCH — đừng đi tìm lại

| Nghi ngờ thường gặp | Kết quả |
| --- | --- |
| Sai tên event | Khớp seed V221 chính xác: `community.post.created` (`PostService.java:213`, `:436`), `community.comment.created` (`CommentService.java:163`), `community.reaction.added` (`InteractionService.java:90`); cả hai call site gọi vô điều kiện trong transaction nghiệp vụ |
| Thiếu field envelope | Đủ 4 field `GamificationEventProcessor.process` đòi (`Contracts/OutboxEventEnvelope.java:15-26`): `eventId`, `type`, `actorId` (authorId, không null), `occurredAt` |
| `occurredAt` ra epoch | Không — `JacksonConfig` (`Contracts/platform/config/JacksonConfig.java:20`) tắt `WRITE_DATES_AS_TIMESTAMPS`, và gói `vn.ftes.aos.platform.config` nằm trong `scanBasePackages` của `CommunityApplication` (dòng 41) ⇒ ISO-8601 |
| Lệch topic | `Topics.ACTIVITY_EVENTS = "ftes.activity.events"` (`Contracts/Topics.java:10`) == `GamificationKafkaConfig.ACTIVITY_TOPIC` (dòng 24) |
| Drift hợp đồng | Jar hợp đồng của Backend và Community **giống nhau từng byte** ở toàn bộ 265 class |
| Sai serializer (bẫy thật) | `application.yml:58` khai `value-serializer: JsonSerializer` — nếu OutboxPublisher dính template đó thì payload bị bọc thành CHUỖI JSON và backend `readTree` ra `TextNode` ⇒ `eventId` null ⇒ skip câm. NHƯNG `CommunityRpcConfig.java:187` inject `KafkaTemplate<String,String>`, bean khớp generic duy nhất là `stringKafkaTemplate` (`Contracts/StringKafkaConfig.java:75`) vốn ép `StringSerializer` (dòng 68). **Không có lỗi ở đây** |
| Dedupe / DLQ nuốt mất | `OutboxWriter.write` sinh `eventId` MỚI cho mỗi dòng; `ActivityDedupe` khoá theo (group, eventId); `quest_events` khoá theo (user, quest, eventId); `ContributorRewardRouting.route` trả null cho hai type community nên không return sớm; lời gọi quest đã bọc try/catch trong `process()` nên không đẩy sang DLQ |
| Lệch hình dạng `subjectRef` | Community ghi chuỗi `"post:<id>"`, backend `extractSubjectId` đọc như object ⇒ `subjectId = null`, **vô hại**: không ném exception, không ảnh hưởng quest |
| Seed quest bị đổi | V221 vẫn là migration DUY NHẤT ghi `gamification.quests`; không migration nào sau đó đổi `daily_limit`. V349:224 và V351:77 chỉ nhắc `COMMUNITY_COMMENT=2` / `COMMUNITY_POST=1` trong chú thích |

---

## Lệnh kiểm tra runtime (chạy theo thứ tự — hai bước đầu quyết định tất cả)

### 1) Profile của container worker community — quyết định nghi phạm số 1

```bash
docker exec ftes-aos-backend-svc-community-worker-1 env | grep -E 'SPRING_PROFILES_ACTIVE|FTES_RUNTIME_CONSUMERS_ENABLED|KAFKA_BOOTSTRAP_SERVERS'
docker exec ftes-aos-backend-svc-community-1        env | grep -E 'SPRING_PROFILES_ACTIVE|FTES_RUNTIME_CONSUMERS_ENABLED|KAFKA_BOOTSTRAP_SERVERS'
docker logs ftes-aos-backend-svc-community-worker-1 2>&1 | grep -iE "profiles are active|No active profile"
```

→ Không thấy profile `worker` ⇒ **nghi phạm số 1 được xác nhận là nguyên nhân**.

### 2) Tồn đọng outbox — bằng chứng cứng nhất, không phụ thuộc suy luận

```bash
psql "$FTES_COMMUNITY_DSN" -c "
  SELECT topic, type,
         count(*) FILTER (WHERE relayed_at IS NULL) AS chua_relay,
         count(*) AS tong,
         min(created_at) FILTER (WHERE relayed_at IS NULL) AS cu_nhat
  FROM community.outbox
  WHERE created_at > now() - interval '14 days'
  GROUP BY 1,2 ORDER BY chua_relay DESC;"
```

→ `chua_relay` lớn và `cu_nhat` lùi về tận ngày tách service (2026-08-16) ⇒ **relay CHƯA BAO
GIỜ chạy**.
→ `chua_relay = 0` ⇒ relay đang chạy, **loại** nghi phạm số 1, đi tiếp bước 3.

### 3) Kafka — cùng cluster không, có message thật không

```bash
docker exec ftes-aos-backend-kafka-1 /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:19092 --list | grep ftes.activity

docker exec ftes-aos-backend-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:19092 \
  --topic ftes.activity.events --from-beginning --max-messages 500 --timeout-ms 20000 \
  | grep -E '"type":"community\.(post|comment)\.created"'

docker exec ftes-aos-backend-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server kafka:19092 \
  --describe --group gamification-engine
```

→ Có message community nhưng LAG dồn ⇒ lỗi ở **worker core**.
→ Không có message nào ⇒ lỗi ở **relay/bootstrap của community**.
→ Message hiện ra dạng `"{\"eventId\":...` (có `\"`) thay vì `{"eventId":...` ⇒ **sai
serializer**, khác kết luận ở mục 0b — **báo lại ngay**, phần phân tích đó phải viết lại.

Ghi chú bootstrap: cả hai phía đọc `${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}`; Backend
api/worker được compose ghim `kafka:19092` (`docker-compose.deploy.yml:25,53`). Giá trị của
Community nằm trong `docker-compose.local.yml` nên chỉ kiểm được bằng bước 1.

### 4) Phía backend — quest có thật sự nhích không

```bash
# xác nhận DB khớp V221: COMMUNITY_COMMENT=2, COMMUNITY_POST=1
psql "$FTES_AOS_DSN" -c "
  SELECT code, trigger_event_type, target_count, daily_limit, reward_coin, is_active
  FROM gamification.quests ORDER BY sort_order;"

psql "$FTES_AOS_DSN" -c "
  SELECT q.code, qp.date_vn, qp.event_count, qp.completed_count, qp.coin_earned
  FROM gamification.quest_progress qp JOIN gamification.quests q ON q.id = qp.quest_id
  WHERE q.code IN ('COMMUNITY_POST','COMMUNITY_COMMENT')
  ORDER BY qp.date_vn DESC LIMIT 20;"

psql "$FTES_AOS_DSN" -c "
  SELECT rule_key, count(*), max(created_at)
  FROM gamification.xp_ledger
  WHERE rule_key LIKE 'community.%' GROUP BY 1;"
```

→ `quest_progress` rỗng VÀ `xp_ledger` community rỗng ⇒ event **chưa từng tới nơi** (khớp bước
2/3).
→ `xp_ledger` có mà `quest_progress` rỗng ⇒ lỗi nằm **riêng ở quest engine**, sang bước 5.

### 5) Event CÓ tới mà quest vẫn không nhích — bật log rồi đăng 1 bài thật

```bash
docker exec ftes-aos-backend-worker-1 curl -s -X POST localhost:8081/actuator/loggers/vn.ftes.aos.gamification \
  -H 'Content-Type: application/json' -d '{"configuredLevel":"DEBUG"}'

# (đăng 1 bài qua edge bằng tài khoản test, chờ ~5s)

docker logs --tail 300 ftes-aos-backend-worker-1 2>&1 | grep -E "skip event thiếu field|lỗi xử lý → DLQ|bỏ qua event của tài khoản bot|quest .* xử lý lỗi"

docker exec ftes-aos-backend-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:19092 \
  --topic ftes.gamification.dlq --from-beginning --max-messages 200 --timeout-ms 15000 | grep community
```

→ `"skip event thiếu field"` ở mức DEBUG là **đường chết CÂM duy nhất còn lại** — phải bật
DEBUG mới thấy.
→ `"bỏ qua event của tài khoản bot"` ⇒ tài khoản test đang bị đánh dấu bot (`BotAccountApi`),
**không phải lỗi đường ống**.

---

## Cây quyết định gọn

```
Bước 1: container community-worker KHÔNG có SPRING_PROFILES_ACTIVE=worker?
   ├─ CÓ thiếu  → nguyên nhân = @Profile("worker") không bao giờ bật. Bước 2 xác nhận lần hai.
   └─ Không thiếu → sang bước 2.

Bước 2: community.outbox có nhiều dòng relayed_at IS NULL, cũ tới ngày tách service?
   ├─ Có   → relay chưa bao giờ chạy. Dừng: sửa cấu hình profile/deploy của service Community.
   └─ Không (chua_relay = 0) → relay chạy tốt, sang bước 3.

Bước 3: topic ftes.activity.events có message community.* không?
   ├─ Không có          → lỗi ở relay/bootstrap community (sai cluster Kafka).
   ├─ Có + LAG dồn      → lỗi ở worker core (consumer chết / không chạy).
   ├─ Có + payload bọc  → SAI SERIALIZER — trái với phân tích ở mục 0b, báo lại ngay.
   └─ Có + LAG = 0      → event đã được tiêu thụ, sang bước 4.

Bước 4: xp_ledger có rule_key community.* không?
   ├─ Không có  → event chưa tới nơi thật (mâu thuẫn bước 3 — kiểm lại group consumer).
   └─ Có, mà quest_progress rỗng → lỗi riêng ở quest engine, sang bước 5.

Bước 5: log DEBUG của vn.ftes.aos.gamification
   ├─ "skip event thiếu field"            → envelope thiếu field ở runtime (khác code đã đọc).
   ├─ "bỏ qua event của tài khoản bot"    → tài khoản test bị đánh dấu bot, không phải lỗi ống.
   └─ Không có dòng nào                   → mở rộng log, không đoán tiếp.
```

## Nếu bước 1/2 xác nhận nghi phạm số 1

Việc sửa **nằm ở repo `FTES-AOS-Community` + cấu hình deploy**, không ở FE. Ba lựa chọn, xếp
theo mức rủi ro (người sở hữu BE quyết, đừng làm thay):

1. Bật `SPRING_PROFILES_ACTIVE=worker` cho container community worker trong compose deploy — vá
   nhanh nhất, nhưng vẫn giữ một cổng câm không nhìn thấy từ git.
2. Bỏ `@Profile("worker")` và cho relay chạy sau cổng `ftes.runtime.consumers-enabled` (bật
   `false` cho container api) — thống nhất với cách Workspace làm, cổng nằm trong `application.yml`
   nên đọc được từ git.
3. Giữ `@Profile` nhưng bổ sung `application-worker.yml` + javadoc + runbook để cổng thôi câm.

Bất kể chọn cách nào: sau khi sửa, chạy lại **bước 2** — `chua_relay` phải tụt về 0 và
`quest_progress` phải nhích ngay lần đăng bài kế tiếp.
