# PROJECT_FLOW.md — Quiz Stack System Flow

## 1. Tổng quan kiến trúc

```
quiz-fe (React + Vite)    ←→    quiz-be (Laravel 12)    ←→    MySQL
        ↕ WebSocket                    ↕
    Laravel Reverb (ws://host:8080)
```

- **FE port:** 5173 (dev), 8000 (Docker qua Nginx)
- **BE port:** 8000
- **Reverb port:** 8080
- **MySQL port:** 3307 (Docker)
- **Auth:** Laravel Sanctum — `Admin` model dùng `admin-token`, `Team` model dùng `player-token`
- **localStorage key:** `quiz-auth` → `{ token, teamId, teamName, gameId, role }`

---

## 2. API Endpoints

### Public (không cần auth)

| Method | URL | Mô tả |
|--------|-----|-------|
| POST | `/api/rooms/{code}/join` | Player join room theo access_code |
| GET | `/api/games/{id}/state` | Public game state |
| GET | `/api/games/{id}/leaderboard` | Leaderboard |
| GET | `/api/games/{id}/round-results` | Kết quả từng round |
| GET | `/api/rooms/code/{code}` | Lấy room info theo code |

### Player (cần Bearer token — player-token)

| Method | URL | Mô tả |
|--------|-----|-------|
| GET | `/api/games/{id}/player-state` | Game state + my_submission của team |
| POST | `/api/games/submit` | Submit đáp án |
| POST | `/api/games/{id}/leave` | Rời phòng |
| POST | `/api/games/{id}/announce` | Announce presence |

### Admin (cần Bearer token — admin-token)

| Method | URL | Mô tả |
|--------|-----|-------|
| POST | `/api/admin/login` | Đăng nhập admin |
| POST | `/api/admin/logout` | Đăng xuất |
| GET | `/api/admin/games/{id}/state` | Admin game state (bao gồm team_submissions) |
| POST | `/api/admin/games/{id}/start` | Bắt đầu game |
| POST | `/api/admin/games/{id}/start-round` | Bắt đầu round mới + mở câu hỏi đầu tiên |
| POST | `/api/admin/games/{id}/open-question` | Mở câu hỏi tiếp theo |
| POST | `/api/admin/games/{id}/close-question` | Đóng câu hỏi hiện tại |
| POST | `/api/admin/games/{id}/finish-round` | Kết thúc round |
| POST | `/api/admin/games/{id}/finish` | Kết thúc game |

---

## 3. Request / Response Schema

### POST `/api/rooms/{code}/join`

**Request:**
```json
{ "team_name": "Team 1" }
```

**Response (200):**
```json
{
  "success": true,
  "code": 200,
  "message": "Joined successfully",
  "data": {
    "token": "1|abc...",
    "team_id": 5,
    "team_name": "Team 1",
    "game_id": 3,
    "room": {
      "id": 3,
      "name": "Quiz Room",
      "access_code": "ABC123"
    }
  }
}
```

**Error (422):** Team name đã tồn tại / game không ở trạng thái pending

---

### POST `/api/games/submit`

**Request:**
```json
{
  "round_question_id": 7,
  "answer_id": 23,
  "response_time_ms": 2340
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "is_correct": true },
  "message": "Answer submitted"
}
```

**Error (409):** Already submitted for this question
**Error (422):** Question is not open

---

### GET `/api/games/{id}/state`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "pending | active | finished",
    "name": "Quiz Room",
    "access_code": "ABC123",
    "rounds_total": 3,
    "questions_per_round": 5,
    "teams": [
      { "id": 1, "name": "Team 1" }
    ],
    "current_round": {
      "round_number": 1,
      "status": "active | finished",
      "questions_done": 2,
      "total_questions": 5,
      "current_question": {
        "round_question_id": 7,
        "order_number": 3,
        "content": "Câu hỏi số 3?",
        "status": "open | closed",
        "opened_at": "2026-06-01T10:00:00.000Z",
        "time_limit_seconds": 30,
        "answers": [
          { "id": 21, "content": "Đáp án A", "is_correct": null },
          { "id": 22, "content": "Đáp án B", "is_correct": null },
          { "id": 23, "content": "Đáp án C", "is_correct": null },
          { "id": 24, "content": "Đáp án D", "is_correct": null }
        ]
      }
    }
  }
}
```

**Lưu ý:** `is_correct` = `null` khi câu hỏi đang `open`, = `true/false` khi `closed`.

---

### GET `/api/games/{id}/player-state`

Giống `/state` nhưng thêm `my_submission` trong `current_question`:

```json
"my_submission": {
  "answer_id": 23,
  "is_correct": true,
  "response_time_ms": 2340
}
```

hoặc `"my_submission": null` nếu chưa submit.

---

## 4. WebSocket Events

**Channel:** `game.{gameId}` (public channel, không cần auth)
**Protocol:** Pusher via Laravel Reverb

### Cách subscribe (Laravel Echo):
```javascript
const channel = echo.channel(`game.${gameId}`);
channel.listen('.game.started', handler);
channel.listen('.question.started', handler);
channel.listen('.question.closed', handler);
channel.listen('.round.finished', handler);
channel.listen('.game.finished', handler);
channel.listen('.team.joined', handler);
```

### Raw WebSocket frame format (Pusher protocol):
```json
{
  "event": "question.started",
  "channel": "game.3",
  "data": "{\"round_question_id\":7,\"order_number\":3,...}"
}
```

`data` là JSON string (cần parse thêm một lần).

---

### `.game.started`

```json
{
  "game_id": 3,
  "status": "active",
  "rounds_total": 3
}
```

Kích hoạt khi: admin gọi `POST /admin/games/{id}/start`

---

### `.question.started`

```json
{
  "round_question_id": 7,
  "round_id": 2,
  "game_id": 3,
  "round_number": 1,
  "total_questions": 5,
  "order_number": 3,
  "time_limit_seconds": 30,
  "opened_at": "2026-06-01T10:00:00.000Z",
  "question": {
    "id": 5,
    "content": "Câu hỏi số 3?",
    "time_limit_seconds": 30,
    "answers": [
      { "id": 21, "content": "Đáp án A", "is_correct": null },
      { "id": 22, "content": "Đáp án B", "is_correct": null },
      { "id": 23, "content": "Đáp án C", "is_correct": null },
      { "id": 24, "content": "Đáp án D", "is_correct": null }
    ]
  }
}
```

Kích hoạt khi: admin gọi `open-question` hoặc `start-round` (tự động mở câu đầu tiên).
**`is_correct` luôn là `null` ở đây** — chưa reveal đáp án.

---

### `.question.closed`

```json
{
  "round_question_id": 7,
  "game_id": 3,
  "question": {
    "id": 5,
    "content": "Câu hỏi số 3?",
    "time_limit_seconds": 30,
    "answers": [
      { "id": 21, "content": "Đáp án A", "is_correct": false },
      { "id": 22, "content": "Đáp án B", "is_correct": false },
      { "id": 23, "content": "Đáp án C", "is_correct": true },
      { "id": 24, "content": "Đáp án D", "is_correct": false }
    ]
  }
}
```

**`is_correct` được reveal ở đây.** FE dùng để hiển thị đáp án đúng/sai.

---

### `.round.finished`

```json
{
  "game_id": 3,
  "round_number": 1
}
```

---

### `.game.finished`

```json
{
  "game_id": 3,
  "status": "finished"
}
```

---

### `.team.joined`

```json
{
  "game_id": 3,
  "team": { "id": 5, "name": "Team 1" }
}
```

---

## 5. Game State Machine

```
PENDING
  │
  ├─ Admin: POST /start
  │
  ▼
ACTIVE
  │
  ├─ Admin: POST /start-round  ─────────────────────────────────────────────┐
  │         (tự động mở câu 1)                                              │
  │   → broadcast: .question.started                                        │
  │                                                                         │
  │   ROUND_ACTIVE                                                          │
  │     │                                                                   │
  │     ├─ Admin: POST /open-question                                       │
  │     │   → broadcast: .question.started                                  │
  │     │                                                                   │
  │     │   QUESTION_OPEN                                                   │
  │     │     │                                                             │
  │     │     ├─ Players: POST /games/submit                                │
  │     │     │                                                             │
  │     │     └─ Admin: POST /close-question                                │
  │     │         → broadcast: .question.closed (với is_correct revealed)   │
  │     │                                                                   │
  │     │   QUESTION_CLOSED                                                 │
  │     │     │                                                             │
  │     │     ├─ (nếu còn câu) Admin: POST /open-question ─────────────────┘
  │     │     │                                                             │
  │     │     └─ (câu cuối) Admin: POST /finish-round                      │
  │     │         → broadcast: .round.finished                             │
  │     │                                                                   │
  │     └─ ROUND_FINISHED                                                   │
  │           │                                                             │
  │           ├─ (còn round) Admin: POST /start-round ─────────────────────┘
  │           │
  │           └─ (round cuối) Admin: POST /finish
  │                → broadcast: .game.finished
  │
  ▼
FINISHED
```

---

## 6. Frontend Routes

| Route | Component | Guard | Mô tả |
|-------|-----------|-------|-------|
| `/join` | JoinRoom | Không | Nhập room code + team name |
| `/player/waiting` | PlayerWaiting | PlayerGuard | Chờ game bắt đầu |
| `/player/game` | PlayerGame | PlayerGuard | Chơi game |
| `/admin/login` | AdminLogin | Không | Đăng nhập admin |
| `/admin/rooms` | AdminRoom | AdminGuard | Quản lý phòng |
| `/admin/rooms/:id` | AdminRoomDetail | AdminGuard | Chi tiết phòng |
| `/admin/game/:id` | AdminGameControl | AdminGuard | Điều khiển game |
| `/stage/*` | Stage* | Không | Màn hình chiếu (TV) |

**PlayerGuard:** kiểm tra `role === "player"` và `token` trong localStorage `quiz-auth`.

---

## 7. Player UI Flow

### Step 1: JoinRoom (`/join`)

```
URL: {baseUrl}/join  (hoặc /join?room=ABC123)

Form 1 — Nhập mã phòng:
  Input: placeholder="Ví dụ: XYZ123"
  Button: type="submit" (text: "Tiếp theo" hoặc tương tự)

Form 2 — Nhập tên đội (sau khi điền mã phòng):
  Input: placeholder="Nhập tên đội..."
  Button: type="submit" (text: "Vào phòng" hoặc tương tự)
```

Sau khi submit form 2: FE gọi `POST /api/rooms/{code}/join`, lưu token + gameId vào localStorage, navigate sang `/player/waiting`.

---

### Step 2: PlayerWaiting (`/player/waiting`)

```
Hiển thị: danh sách team đã join
Chờ: .game.started event
Khi nhận .game.started: navigate sang /player/game
```

---

### Step 3: PlayerGame (`/player/game`)

**Khi câu hỏi đang open:**
```
Hiển thị:
  - Nội dung câu hỏi
  - 4 đáp án dạng button (label: A, B, C, D)
  - Button "Chốt kèo" (submit) — disabled cho đến khi chọn đáp án

Selector đáp án: button chứa span với text "A"/"B"/"C"/"D"
Selector submit: button:has-text("Chốt kèo")
```

**Khi đã submit (alreadySubmitted = true):**
```
Hiển thị: "Đã nộp · Đang chờ câu tiếp theo..."
```

**Khi câu hỏi closed (question.status = "closed"):**
```
Hiển thị ClosedScreen: đáp án đúng màu xanh, đáp án sai màu đỏ
```

**Khi waiting for round:**
```
Hiển thị WaitingForRound: "Chuẩn bị cho Vòng N"
```

**Khi game finished:**
```
Hiển thị GameFinished: kết quả các vòng từ localStorage
```

---

## 8. DOM Selectors (cho Test Bot)

```javascript
// JoinRoom
roomCodeInput:  'input[placeholder*="XYZ123"]'       // hoặc input[placeholder*="mã phòng"]
teamNameInput:  'input[placeholder*="Nhập tên đội"]'
formSubmit:     'button[type="submit"]'               // 1 form visible tại 1 thời điểm

// PlayerGame — answer buttons
answerContainer: '.grid.gap-4'                        // grid chứa 4 đáp án
answerButtons:   '.grid.gap-4 button'                 // 4 đáp án
answerLabel:     'span.w-8'                           // span chứa "A"/"B"/"C"/"D"

// PlayerGame — submit
submitButton:    'button:has-text("Chốt kèo")'

// State detection (text content)
waitingText:     ':text("Đang chờ")'
gameFinishedText: ':text("kết thúc")'
```

---

## 9. localStorage Structure

Key: `quiz-auth`

```json
{
  "state": {
    "token": "1|abc...",
    "teamId": 5,
    "teamName": "Team 1",
    "gameId": 3,
    "role": "player"
  },
  "version": 0
}
```

*(Zustand persist format)*

---

## 10. WebSocket Connection Details

```javascript
// echo.ts — Reverb/Pusher config
{
  broadcaster: 'reverb',
  key: VITE_REVERB_APP_KEY,
  wsHost: VITE_REVERB_HOST,      // default: localhost
  wsPort: VITE_REVERB_PORT,      // default: 8080
  forceTLS: false,               // scheme = 'http'
  enabledTransports: ['ws', 'wss']
}
```

Channel subscription: `echo.channel('game.{gameId}').listen('.event.name', handler)`

---

## 11. Scoring & Ranking

Xếp hạng theo thứ tự ưu tiên:
1. **correct_count** — số câu đúng (cao hơn = tốt hơn)
2. **total_response_time_ms** — tổng thời gian phản hồi của các câu đúng (thấp hơn = tốt hơn)
3. Tiebreaker round cuối: câu đúng sớm nhất (chưa implement)
