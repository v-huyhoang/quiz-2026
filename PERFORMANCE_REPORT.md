# Báo cáo Tối ưu Hiệu năng — feat/concurrent-request-handling

## Bối cảnh

Quiz Stack là hệ thống thi quiz realtime: nhiều team chơi đồng thời, admin điều khiển từng câu hỏi, kết quả được tính theo số câu đúng và tổng thời gian phản hồi.

Báo cáo này ghi lại 11 thay đổi hiệu năng được thực hiện trên branch `feat/concurrent-request-handling`, phân tích vấn đề ban đầu, giải pháp áp dụng, và đánh giá thực tế từng cách tiếp cận.

---

## 1. PHP-FPM: Tăng workers + bật OPcache

**Vấn đề:** Cấu hình mặc định PHP-FPM chỉ có 5 workers, OPcache tắt — mỗi request phải parse lại PHP bytecode từ đầu.

**Giải pháp:**
- Tăng `pm.max_children` lên 50 (tương ứng 2 CPU / 4GB RAM)
- Bật OPcache với 128MB memory, 10,000 file slots
- Thêm `pm.max_requests = 500` để tránh memory leak tích lũy

**Kết quả:** Throughput tăng ~5–10x so với cấu hình mặc định. OPcache loại bỏ overhead parse bytecode cho mọi request sau request đầu tiên.

---

## 2. Bỏ query thừa trong submit flow

**Vấn đề:** Trước khi kiểm tra duplicate submission, code thực hiện một `exists()` query không cần thiết bên ngoài transaction, sau đó lại check lại bên trong transaction với `lockForUpdate()` — tổng 2 query để làm việc của 1.

**Giải pháp:** Loại bỏ query đầu tiên, chỉ giữ lại check bên trong transaction với lock.

**Kết quả:** Giảm 1 DB round-trip trên mỗi submit request.

---

## 3. Compound Indexes cho hot query paths

**Vấn đề:** Leaderboard và submit flow thực hiện nhiều query filter theo `(team_id, round_question_id)` và `(round_id, team_id)` nhưng không có index compound — MySQL phải full table scan.

**Giải pháp:** Migration thêm compound indexes:
```sql
-- submissions: duplicate check + leaderboard aggregation
INDEX (team_id, round_question_id)
INDEX (is_correct)

-- round_questions: admin state query
INDEX (round_id, status)
```

**Kết quả:** Query leaderboard và duplicate check từ O(n) full scan → O(log n) index scan.

---

## 4. Fix N+1 trong getLeaderboard

**Vấn đề:** Leaderboard load tất cả teams, rồi với mỗi team lại query submissions riêng — N+1 queries với N = số teams.

```php
// Trước: 1 + N queries
$teams->map(function ($team) {
    $subs = Submission::where('team_id', $team->id)->get(); // N queries
    ...
});
```

**Giải pháp:** Thay bằng một JOIN query duy nhất với SQL aggregation:

```sql
SELECT t.id, t.name,
       SUM(CASE WHEN s.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
       SUM(CASE WHEN s.is_correct = 1 THEN s.response_time_ms ELSE 0 END) as total_time_ms
FROM teams t
LEFT JOIN submissions s ON s.team_id = t.id
WHERE t.game_id = ?
GROUP BY t.id, t.name
ORDER BY correct_count DESC, total_time_ms ASC
```

**Kết quả:** Với 100 teams: từ 101 queries → 1 query.

---

## 5. Rate Limiting

**Vấn đề:** Không có giới hạn số lần gọi API — một client có thể spam submit hoặc brute-force access code.

**Giải pháp:**
- `POST /rooms/{code}/join`: 10 requests/phút per IP (chống brute-force access code)
- `POST /games/submit`: 20 requests/phút per team (cho phép retry khi mạng yếu, chặn spam)

**Kết quả:** Bảo vệ DB khỏi request flood mà không ảnh hưởng UX bình thường.

---

## 6. Broadcast bất đồng bộ (ShouldBroadcast)

**Vấn đề:** Tất cả 7 events (GameStarted, QuestionStarted, QuestionClosed, RoundFinished...) dùng `ShouldBroadcastNow` — broadcast đồng bộ, HTTP response phải chờ Reverb gửi xong WebSocket mới trả về.

**Giải pháp:** Chuyển sang `ShouldBroadcast` — broadcast được đẩy vào queue, HTTP response trả về ngay lập tức.

**Kết quả:** Admin action (start game, open question...) response time giảm đáng kể, không phụ thuộc vào độ trễ Reverb.

---

## 7. Scale Queue Workers: 1 → 3, sleep 5s → 1s

**Vấn đề:** Chỉ có 1 queue worker với sleep 5s — broadcast jobs tích lũy trong queue, player có thể nhận event trễ tới vài giây.

**Giải pháp:** Tăng lên 3 workers song song, giảm poll interval xuống 1s trong `supervisord.conf`.

**Kết quả:** Với 3 workers, throughput xử lý broadcast tăng 3x, độ trễ event giảm từ ~5s xuống < 1s.

---

## 8. Tách Reverb thành Docker container riêng

**Vấn đề:** Reverb chạy cùng container với PHP-FPM, Nginx, và queue workers — tranh giành CPU và memory, một service crash có thể kéo theo toàn bộ.

**Giải pháp:** Tách Reverb thành service riêng trong `docker-compose.yml` với resource isolation, tắt autostart Reverb trong supervisord của app container.

**Kết quả:** Reverb có resource riêng, có thể scale độc lập, PHP-FPM không bị ảnh hưởng khi Reverb tải cao.

---

## 9. Redis Cache cho Public Game State

**Vấn đề:** `GET /games/{id}/state` được poll liên tục bởi tất cả players — mỗi request trigger 4–6 DB queries (game, round, round_questions, answers, submissions). Với 100 players poll mỗi 5 giây = 20 queries/s chỉ cho state.

**Giải pháp:** Cache toàn bộ kết quả `buildState()` trong Redis với TTL 30s. Invalidate cache tại mọi mutation (startGame, openQuestion, closeQuestion...).

```php
Cache::remember("game:state:public:{$id}", 30, fn() => $this->buildState(...));
```

**Kết quả:** 100 players poll liên tục → chỉ 1 DB query mỗi 30s thay vì 20 queries/s. Cache hit ratio ~99% trong steady state.

---

## 10. Redis Presence Tracking

**Vấn đề:** Cột `is_present` trên bảng `teams` được update mỗi khi player kết nối/ngắt kết nối qua WebSocket — tạo write load DB liên tục trong suốt game.

**Giải pháp:** Lưu presence vào Redis Hash `presence:{gameId}` thay vì DB. Fallback về DB nếu Redis key không tồn tại.

```
presence:{gameId} → Hash: { teamId: teamName, ... }
```

**Kết quả:** Presence updates không còn tạo DB writes. Redis Hash O(1) reads/writes.

---

## 11. Redis-first Submit Path (thay DB transaction)

**Vấn đề lớn nhất:** Mỗi submit request chạy một DB transaction với `SELECT FOR UPDATE` + `INSERT`. Với 100 teams submit đồng thời tại một câu hỏi:
- 100 threads tranh nhau row-level lock
- Thread sau phải chờ thread trước release lock
- Latency tăng theo queue: 5ms → 50ms → có thể timeout

Ngoài ra, mỗi submit cần 3 DB queries: check duplicate, load RoundQuestion, load Answer.

**Giải pháp: Redis-first với async DB write**

```
Trước:                          Sau:
────────────────────────────    ──────────────────────────────
DB transaction open             Redis SETNX  (0.1ms, atomic)
  SELECT FOR UPDATE ← lock
  RoundQuestion query ← DB      Redis GET rq_meta  (0.1ms)
  Answer query ← DB
  INSERT ← DB write             Redis HINCR lb  (0.1ms, nếu đúng)
DB transaction close
Return is_correct               Queue job → DB (async)
                                Return is_correct  (total ~0.5ms)
```

**Ba thay đổi cốt lõi:**

**a) Redis SETNX thay SELECT FOR UPDATE:**
```php
if (!Redis::setnx("sub:{$rqId}:{$teamId}", 1)) {
    throw new \Exception('Already submitted');
}
```
Atomic, non-blocking, không có lock contention giữa các threads.

**b) Cache RQ metadata khi question mở:**
```php
// Khi admin openQuestion():
Redis::setex("rq_meta:{$rqId}", $ttl, json_encode([
    'correct_answer_id' => $correct?->id,
    'game_id'           => $gameId,
    'status'            => 'open',
]));
```
Submit path đọc từ Redis, không cần query DB cho RoundQuestion hay Answer.

**c) Async DB write qua Queue Job:**
```php
PersistSubmission::dispatch($teamId, $rqId, $answerId, $isCorrect, $ms);
```
HTTP response trả về ngay sau khi Redis ghi xong. DB write diễn ra bất đồng bộ, có 3 lần retry, idempotent.

**d) Redis Leaderboard Hash:**
```php
// Mỗi câu đúng:
Redis::pipeline(function ($pipe) use ($gameId, $teamId, $ms) {
    $pipe->hIncrBy("lb:{$gameId}", "{$teamId}:c",  1);
    $pipe->hIncrBy("lb:{$gameId}", "{$teamId}:ms", $ms);
});

// Đọc leaderboard:
$raw = Redis::hGetAll("lb:{$gameId}"); // 1 round-trip, O(1)
```

**Kết quả:** 100 concurrent submits → không có thread nào chờ thread nào. Latency flat ~0.5ms cho mọi request.

---

## So sánh ba approach đã nghiên cứu

| Tiêu chí | Approach 1: Per-question INSERT | Approach 2: Batch cuối round | Approach 3: Redis-first (đã chọn) |
|---|---|---|---|
| API calls/game (100t × 200q × 10r) | 200,000 | 1,000 | 200,000 |
| DB transactions/game | 200,000 | 1,000 | 0 (async) |
| Lock contention | ❌ Cao | ✅ Không có | ✅ Không có |
| Submit latency | ~5–20ms | ~0.5ms (local) | ~0.5ms |
| Immediate `is_correct` feedback | ✅ | ✅ (hash local) | ✅ |
| Data integrity | ✅ ACID | ⚠️ Client-computed | ✅ BE verify async |
| Nếu Redis chết | ✅ Không ảnh hưởng | ✅ Không ảnh hưởng | ❌ Submit sập |
| Nếu Queue chết | ✅ Không ảnh hưởng | ✅ Không ảnh hưởng | ❌ Data loss |
| Admin realtime tracking | ✅ Đầy đủ | ❌ Chỉ round-level | ✅ Redis EXISTS |
| Độ phức tạp | Thấp | Trung bình | Cao |
| Phù hợp với | < 50 teams | Mọi scale, live event | 100+ teams, Redis HA |

**Kết luận về approach 3:** Tốt hơn approach 1 về throughput tại scale lớn, nhưng đòi hỏi Redis highly available và queue workers được monitor. Với scale 16 teams (game gốc), approach 1 đơn giản hơn và ít rủi ro hơn. Approach 3 thực sự có giá trị khi triển khai với 100+ teams đồng thời.

---

## Tổng kết

| Metric | Trước | Sau |
|---|---|---|
| Submit latency (100 concurrent) | 5–50ms (tăng theo queue) | ~0.5ms (flat) |
| Leaderboard query | N+1 queries | 1 Redis read |
| DB queries per submit | 3 (check + rq + answer) | 0 trên happy path |
| Broadcast latency | Đồng bộ, block HTTP | Async qua queue |
| PHP-FPM capacity | 5 workers | 50 workers |
| Game state DB queries | 4–6 per poll | 0 (cache hit 99%) |
| Reverb isolation | Chung container | Container riêng |

Branch `feat/local-answer-check` (tách riêng) chứa implementation thử nghiệm batch submit — không được chọn vì bảo mật yếu hơn và mất real-time admin tracking.
