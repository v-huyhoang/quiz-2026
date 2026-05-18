# 📦 Quiz Stack — Context Summary
> Tổng hợp từ: requirement.md, plan.md, database.md, logic.md
> Cập nhật: flow QR login + Laravel Reverb + **round-based scoring**

## 🎯 Tổng quan dự án
Game thi đấu trắc nghiệm theo nhóm (team-based quiz competition).
- **16 teams**, mỗi team 1 người đại diện chơi
- **3 rounds**, mỗi round **5–10 câu hỏi**
- Scoring tính **theo round** (không theo question) để giảm rủi ro
- Sau mỗi round: có giai đoạn nghỉ, tổng hợp kết quả, vinh danh round winner
- Cuối cùng: **StageFinal** tổng kết toàn game, vinh danh overall champion

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Backend | Laravel 12, REST API, Sanctum |
| Frontend | React + Vite, Axios, Zustand/Redux |
| Database | PostgreSQL (ưu tiên) hoặc MySQL 8+ |
| Realtime | Laravel Reverb hoặc Pusher |

**Frontend hiện tại:** React + Vite + TailwindCSS v4 + Framer Motion (`motion/react`)

---

## 👥 Roles & Màn hình

### 🆕 Join Flow (thay thế login cũ)

```
Admin tạo Room → sinh QR code
   ↓
Player quét QR (URL: /join?room=ROOM_CODE)
   ↓
Trang /join: nhập Team Name → POST /api/rooms/{code}/join
   ↓
Server: tạo team + token → trả về token
   ↓
/player/waiting (sảnh chờ, kết nối WebSocket)
```

> ⚠️ Không cần password, không cần email. Token chỉ valid trong session game đó.

---

### Player (`/player/*`)
| Route | Màn hình |
|---|---|
| `/join?room=CODE` | Quét QR → nhập tên team → join room |
| `/player/waiting` | Sảnh chờ — chờ host start |
| `/player/game` | Chơi câu hỏi — countdown, chọn đáp án, submit |

### Admin (`/admin/*`)
| Route | Màn hình |
|---|---|
| `/admin/login` | Đăng nhập admin |
| `/admin/dashboard` | Quản lý: Overview / Question Bank / Room Config |
| `/admin/game-control` | Điều khiển game: start/open/close question |

### Stage (`/stage/*`) — màn hình trình chiếu (chiếu lên TV/màn hình lớn)
| Route | Màn hình | Hiển thị khi nào |
|---|---|---|
| `/stage/leaderboard` | Bảng xếp hạng trong round | Trong suốt round (hiển thị tiến độ) |
| `/stage/round-complete` | Tổng kết 1 round | Sau khi round kết thúc, trước khi round mới |
| `/stage/final` | Vinh danh overall champion | Sau khi kết thúc toàn bộ game |

---

## 📡 Realtime Events (WebSocket — Laravel Reverb)

### Events Player lắng nghe
| Event | Payload mẫu | Hành động FE |
|---|---|---|
| `game.started` | `{ game_id }` | Navigate `/player/game` |
| `round.started` | `{ round_id, round_number }` | Hiển thị số round mới |
| `question.opened` | `{ question_id, content, options, opened_at, time_limit }` | Hiện câu hỏi + start countdown |
| `question.closed` | `{ question_id }` | Lock UI, hiện "Chờ câu tiếp..." |
| `round.finished` | `{ round_id, results[] }` | Navigate `/player/waiting` (chờ round mới) |
| `game.finished` | `{ winner_team }` | — (Stage xử lý) |

### Events Stage lắng nghe
| Event | Hành động FE |
|---|---|
| `round.finished` | Navigate `/stage/round-complete` + hiện kết quả round |
| `round.started` | Navigate `/stage/leaderboard` |
| `game.finished` | Navigate `/stage/final` + hiện champion |

### Events riêng từng team (private channel `team.{team_id}`)
| Event | Payload | Hành động FE |
|---|---|---|
| `submission.received` | `{ is_correct }` | Hiện tick xác nhận (KHÔNG hiện đúng/sai) |

> ⚠️ **FE không tự navigate khi hết timer** — phải chờ event từ server.
> ⚠️ **Không hiện đúng/sai ngay** — chỉ hiện sau khi `round.finished` broadcast kết quả.

---

## 📬 Submit Flow (quan trọng cho `PlayerGame.tsx`)

```
Player chọn đáp án → nhấn Submit
  → POST /api/submissions { question_id, answer_id }
  → Backend: validate → check open → check duplicate → save → score
  → FE: disabled (submitted state)
  → Chờ event `question.closed` hoặc `question.opened` (câu tiếp)
```

**Payload submit:**
```json
{ "question_id": 1, "answer_id": 5 }
```

---

## 🗄️ Database — Các bảng chính

| Bảng | Mục đích |
|---|---|
| `teams` | Đội chơi (name, code) |
| `users` | Người chơi (belongs to team, is_representative) |
| `games` | Trận đấu (status: pending/active/finished) |
| `rounds` | Các vòng (belong to game, round_number) |
| `questions` | Câu hỏi (belong to round, status: pending/open/closed) |
| `answers` | Các lựa chọn (belong to question, is_correct) |
| `submissions` | Bài nộp của team (UNIQUE team_id + question_id) |
| `round_results` | Kết quả theo round (correct_count, total_response_time_ms) |
| `game_results` | Kết quả cuối (rank, is_winner) |

**Constraint chống duplicate:**
```sql
UNIQUE(team_id, question_id)  -- trong bảng submissions
```

---

## 🏆 Scoring & Ranking Logic

### Cơ chế tính điểm (QUAN TRỌNG)

> **Tính theo round, không theo question** — để giảm thiểu rủi ro sai số realtime.

**Trong 1 round:**
```
correct_count  = tổng câu đúng trong round
response_time  = tổng thời gian trả lời (chỉ tính câu đúng)
```

**Round winner** = team có:
1. `correct_count` cao nhất
2. Nếu bằng nhau → `total_response_time_ms` thấp nhất

**Overall champion** (sau tất cả rounds) = tổng hợp từ `game_results`:
1. Tổng `correct_count` cao nhất (across all rounds)
2. Nếu bằng → tổng `response_time_ms` thấp nhất
3. Tiebreaker cuối: câu đúng sớm nhất ở round cuối

### Game Flow với Scoring

```
Round 1: Q1 → Q2 → ... → Qn → round.finished
   ↓ (server tính round_results, broadcast)
StageRoundComplete: hiện top 3 round 1, round winner
Player: màn hình chờ "Chuẩn bị round 2..."
   ↓ (admin trigger round 2)
Round 2: ... → round.finished
   ↓
StageRoundComplete: hiện top 3 round 2
   ↓ (admin trigger round 3 - round cuối)
Round 3: ... → round.finished → game.finished
   ↓ (server tính game_results, determine winner)
StageFinal: 🏆 vinh danh Overall Champion
```

> ⚠️ **Server-side only** — FE không tự tính điểm, không trust timestamp FE.

---

## 🚨 Những điều FE phải tuân thủ

1. **Không tự navigate sau khi submit** — chờ event từ server
2. **Disable toàn bộ UI sau khi submit** (đã làm ở PlayerGame)
3. **Không lưu answer vào localStorage** — submit thẳng API ngay
4. **Không hiển thị đáp án đúng** trước khi server gửi
5. **Polling fallback** khi WebSocket mất kết nối
6. **Auth token** (Sanctum) phải đính kèm mọi API request

---

## 🔌 API Endpoints cần implement (FE side)

### Player APIs
| Method | Endpoint | Dùng ở |
|---|---|---|
| POST | `/api/rooms/{code}/join` | JoinRoom — nhập tên team |
| GET | `/api/game/current` | PlayerWaiting — trạng thái game |
| GET | `/api/rounds/current` | PlayerGame — round hiện tại |
| POST | `/api/submissions` | PlayerGame — nộp bài |

### Stage APIs (polling fallback)
| Method | Endpoint | Dùng ở |
|---|---|---|
| GET | `/api/rounds/{id}/results` | StageRoundComplete — kết quả round |
| GET | `/api/game/{id}/results` | StageFinal — kết quả cuối |
| GET | `/api/game/{id}/leaderboard` | StageLeaderBoard (polling) |

### Admin APIs
| Method | Endpoint | Dùng ở |
|---|---|---|
| POST | `/api/admin/login` | AdminLogin |
| POST | `/api/admin/rooms` | AdminRoom — tạo room |
| GET | `/api/admin/rooms` | AdminRoom — list rooms |
| POST | `/api/admin/questions` | AdminQuestion — tạo câu |
| DELETE | `/api/admin/questions/{id}` | AdminQuestion |
| POST | `/api/admin/games/{id}/start` | AdminGameControl |
| POST | `/api/admin/rounds/{id}/start` | AdminGameControl |
| POST | `/api/admin/questions/{id}/open` | AdminGameControl |
| POST | `/api/admin/questions/{id}/close` | AdminGameControl |
| POST | `/api/admin/rounds/{id}/finish` | AdminGameControl |
| POST | `/api/admin/games/{id}/finish` | AdminGameControl |

---

## 📁 Cấu trúc thư mục FE hiện tại

```
src/
├── apps/
│   ├── player/     PlayerLogin, PlayerWaiting, PlayerGame
│   ├── admin/      AdminLogin, AdminDashboard, AdminGameControl, AdminQuestion
│   └── stage/      StageLeaderBoard, StageRoundComplete, StageFinal
├── routes/         AppRoutes.tsx
├── type/           question.ts, room.ts
├── libs/           utils.ts
└── services/       (cần tạo: api.ts, websocket.ts)
```

---

## ⚡ Realtime: Laravel Reverb (đã chọn)

### Đánh giá so với Pusher

| Tiêu chí | Laravel Reverb | Pusher |
|---|---|---|
| Chi phí | **Miễn phí** (self-host) | Có giới hạn free tier |
| Kiểm soát | **Toàn quyền** | Phụ thuộc bên thứ 3 |
| Tích hợp Laravel | **Native** (first-party) | Cần cấu hình thêm |
| Latency | Phụ thuộc server | Thường tốt hơn (CDN) |
| Scale | Cần tự scale | Tự động scale |
| Setup | Cần cấu hình server | Đơn giản hơn |

**Kết luận: Dùng Reverb là hợp lý** cho dự án này vì:
- Scale nhỏ (16 teams), không cần Pusher CDN
- Full control, không lo rate limit
- Native với Laravel 12, ít boilerplate
- Self-host = không tốn tiền

### Cấu hình FE cần

```ts
// services/websocket.ts
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'  // Reverb dùng Pusher protocol

window.Pusher = Pusher
const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
})
```

### Channel naming

```
game.{game_id}          → tất cả events chính
team.{team_id}          → events riêng cho từng team
presence-room.{room_id} → lobby presence (ai đang online)
```

---

## 📋 Business Logic Summary (từ logic.md)

### Submission Validation (theo thứ tự server check)

1. Authenticated? (token hợp lệ)
2. User là `is_representative`?
3. Game đang `active`?
4. Round đang `active`?
5. Question đang `open`?
6. Chưa timeout? (`now() <= question.closed_at`)
7. Chưa submit cho câu này? (`UNIQUE team_id + question_id`)

> Nếu fail bất kỳ bước nào → reject, không lưu DB

### Submission Transaction Flow

```
DB::transaction {
  1. Tìm đáp án đúng
  2. Tính is_correct
  3. Tính response_time = submitted_at - question.opened_at  (server time)
  4. INSERT submissions
  5. Commit
}
```

### Realtime Event Payloads

```json
// question.opened
{ "question_id": 1, "opened_at": "2024-01-01T10:00:00Z" }

// submission.received (chỉ gửi về cho team đó)
{ "team_id": 1, "is_correct": true }

// leaderboard.updated
[{ "team": "Alpha", "score": 10, "rank": 1 }]
```

### State Machine

```
Game:     pending → active → finished
Round:    pending → active → finished
Question: pending → open   → closed
```

### Failure Cases

| Case | Xử lý |
|---|---|
| Duplicate submit | Reject, trả `"Already submitted"` |
| Timeout | Reject |
| DB fail | Rollback transaction |
| Invalid answer | Reject |
| WebSocket ngắt | Polling fallback |

---

## 🎨 Design Tokens (Tailwind @theme)

```css
--color-primary: #006876           /* Teal đậm — màu chủ */
--color-primary-container: #00bcd4 /* Teal sáng — accent */
--color-secondary: #ac3509         /* Cam đỏ */
--color-surface: #f9f9f9
--font-sans: Montserrat
```
