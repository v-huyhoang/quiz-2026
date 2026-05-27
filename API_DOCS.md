# Quiz Stack 2026 — API Documentation

> **Base URL:** `http://localhost:8000/api`  
> **Auth:** Laravel Sanctum — gửi token qua header `Authorization: Bearer {token}`  
> **Response format chung:**
> ```json
> { "success": true, "code": 200, "message": "...", "data": {...} }
> ```
> **Cập nhật:** 2026-05-27

---

## Mục lục

- [Auth](#1-auth)
- [Questions](#2-questions)
- [Rooms](#3-rooms)
- [Game Flow — Public](#4-game-flow--public)
- [Game Flow — Admin](#5-game-flow--admin)
- [WebSocket Events (Reverb)](#6-websocket-events-reverb)
- [APIs cần tạo mới](#7-apis-cần-tạo-mới-planned)
- [Game State Machine](#8-game-state-machine)
- [Frontend API Clients](#9-frontend-api-clients)
- [Error Response Format](#10-error-response-format)

---

## 1. Auth

### POST `/admin/login`
Đăng nhập với tài khoản admin.

**Auth:** Không cần  
**Request body:**
```json
{
  "email": "admin@quiz.com",
  "password": "password"
}
```
**Response 200:**
```json
{
  "success": true,
  "code": 200,
  "message": "Logged in successfully",
  "data": {
    "admin": {
      "id": 1,
      "name": "Admin",
      "email": "admin@quiz.com"
    },
    "token": "1|abc123..."
  }
}
```
**Errors:**
- `422` — Email hoặc password sai

---

### POST `/admin/logout`
Đăng xuất, xóa token hiện tại.

**Auth:** `Bearer {admin-token}`  
**Request body:** Không có  
**Response 200:**
```json
{
  "success": true,
  "code": 200,
  "message": "Logged out successfully",
  "data": null
}
```

---

## 2. Questions

> Tất cả đều yêu cầu `Bearer {admin-token}`

### GET `/admin/questions`
Lấy danh sách câu hỏi có phân trang.

**Query params:** Không có (trang đầu tiên, 20 câu/trang)  
**Response 200:**
```json
{
  "success": true,
  "code": 200,
  "message": "Questions retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "content": "Thủ đô của Việt Nam là gì?",
        "type": "single_choice",
        "time_limit_seconds": 30,
        "answers": [
          { "id": 1, "content": "Hà Nội", "is_correct": true },
          { "id": 2, "content": "TP. HCM", "is_correct": false },
          { "id": 3, "content": "Đà Nẵng", "is_correct": false },
          { "id": 4, "content": "Huế", "is_correct": false }
        ]
      }
    ],
    "meta": {
      "currentPage": 1,
      "lastPage": 5,
      "perPage": 20,
      "total": 98
    }
  }
}
```

---

### POST `/admin/questions`
Tạo câu hỏi mới.

**Request body:**
```json
{
  "content": "Hành tinh lớn nhất Hệ Mặt Trời?",
  "type": "single_choice",
  "time_limit_seconds": 20,
  "answers": [
    { "content": "Sao Mộc", "is_correct": true },
    { "content": "Sao Thổ", "is_correct": false },
    { "content": "Trái Đất", "is_correct": false },
    { "content": "Sao Hỏa", "is_correct": false }
  ]
}
```
**Validation:**
- `content` — required, string
- `time_limit_seconds` — required, integer, min:5, max:120
- `answers` — required, array, phải có đúng 1 đáp án có `is_correct: true`

**Response 201:**
```json
{
  "success": true,
  "code": 201,
  "message": "Question created successfully",
  "data": { "id": 42, "content": "...", "answers": [...] }
}
```
**Errors:**
- `422` — Validation fail (ví dụ: không có đúng 1 đáp án đúng)

---

### DELETE `/admin/questions/{id}`
Xóa câu hỏi.

**Response 200:**
```json
{
  "success": true,
  "code": 200,
  "message": "Question deleted successfully",
  "data": null
}
```
**Errors:**
- `500` — Xóa thất bại

---

### POST `/admin/questions/import`
Import hàng loạt câu hỏi từ file CSV hoặc XLSX.

**Content-Type:** `multipart/form-data`  
**Request:**
```
file: <binary — .csv hoặc .xlsx, tối đa 500 dòng>
```
**CSV/XLSX format (header row):**
```
content | time_limit_seconds | answer_1 | is_correct_1 | answer_2 | is_correct_2 | answer_3 | is_correct_3 | answer_4 | is_correct_4
```
**Response 201:**
```json
{
  "success": true,
  "code": 201,
  "message": "Questions imported successfully",
  "data": { "imported": 45, "failed": 2 }
}
```
**Errors:**
- `422` — File không hợp lệ hoặc vượt 500 dòng

---

### GET `/admin/questions/{id}` ⚠️ STUB
> **Trạng thái:** Controller stub rỗng — chưa implement  
> **Xem task F9 để implement**

---

### PUT `/admin/questions/{id}` ⚠️ STUB
> **Trạng thái:** Controller stub rỗng — chưa implement  
> **Xem task F8 để implement**

---

## 3. Rooms

### GET `/admin/rooms`
> **Auth:** `Bearer {admin-token}`

Lấy danh sách tất cả rooms (flat, không phân trang).

**Response 200:**
```json
{
  "success": true,
  "code": 200,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "name": "Championship Finals 2024",
      "access_code": "ABC123",
      "rounds": 3,
      "questions_per_round": 10,
      "question_mode": "random",
      "status": "pending"
    }
  ]
}
```

---

### POST `/admin/rooms`
> **Auth:** `Bearer {admin-token}`

Tạo phòng mới và khởi tạo cấu trúc rounds.

**Request body (mode random):**
```json
{
  "name": "Championship Finals 2024",
  "rounds": 3,
  "questions_per_round": 10,
  "access_code": "ABC123",
  "question_mode": "random"
}
```
**Request body (mode manual):**
```json
{
  "name": "Championship Finals 2024",
  "rounds": 2,
  "questions_per_round": 5,
  "access_code": "XYZ999",
  "question_mode": "manual",
  "round_questions": [
    { "round_number": 1, "question_ids": [1, 2, 3, 4, 5] },
    { "round_number": 2, "question_ids": [6, 7, 8, 9, 10] }
  ]
}
```
**Validation:**
- `name` — required, string, max:255
- `rounds` — required, integer, 1–10
- `questions_per_round` — required, integer, 1–20
- `access_code` — required, string, max:10, **unique** trong bảng games
- `question_mode` — required, enum: `random` | `manual`
- `round_questions` — required nếu `question_mode = manual`

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Championship Finals 2024",
    "access_code": "ABC123",
    "rounds": 3,
    "questions_per_round": 10,
    "question_mode": "random",
    "status": "pending"
  }
}
```
**Errors:**
- `422` — access_code đã tồn tại hoặc validation fail

---

### DELETE `/admin/rooms/{id}`
> **Auth:** `Bearer {admin-token}`

Xóa phòng (chỉ nên xóa khi status = pending).

**Response 200:**
```json
{ "success": true, "data": null }
```

---

## 4. Game Flow — Public

> Các endpoint này **không cần auth** — dành cho player và màn chiếu (Stage)

### POST `/rooms/{code}/join`
Player join phòng bằng mã phòng.

**URL param:** `code` — access code của phòng (case-insensitive)  
**Request body:**
```json
{
  "team_name": "Neon Knights"
}
```
**Validation:**
- `team_name` — required, string, max:255
- Phòng phải ở trạng thái `pending`
- Tên đội chưa được dùng trong game này

**Response 200:**
```json
{
  "success": true,
  "message": "Joined successfully",
  "data": {
    "token": "5|player-token-xyz",
    "team_id": 7,
    "team_name": "Neon Knights",
    "game_id": 1,
    "room": {
      "id": 1,
      "name": "Championship Finals 2024",
      "access_code": "ABC123"
    }
  }
}
```
**Errors:**
- `422` — Game không ở trạng thái pending, hoặc tên đội đã tồn tại
- `404` — Không tìm thấy phòng với mã đó

---

### GET `/games/{id}/state`
Lấy trạng thái game (public view — ẩn đáp án đúng khi câu hỏi đang mở).

> **Lưu ý sử dụng:** Endpoint này chủ yếu dùng để lấy initial state khi component mount. Các cập nhật real-time sau đó được nhận qua **WebSocket events** (xem [Section 6](#6-websocket-events-reverb)).

**URL param:** `id` — game ID  
**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "name": "Championship Finals 2024",
    "access_code": "ABC123",
    "rounds_total": 3,
    "teams": [
      { "id": 1, "name": "Neon Knights" },
      { "id": 2, "name": "Data Demons" }
    ],
    "current_round": {
      "round_number": 1,
      "status": "active",
      "questions_done": 2,
      "total_questions": 10,
      "current_question": {
        "round_question_id": 5,
        "order_number": 3,
        "content": "Hành tinh lớn nhất Hệ Mặt Trời?",
        "status": "open",
        "opened_at": "2026-05-26T10:30:00.000Z",
        "time_limit_seconds": 20,
        "answers": [
          { "id": 1, "content": "Sao Mộc", "is_correct": null },
          { "id": 2, "content": "Sao Thổ", "is_correct": null },
          { "id": 3, "content": "Trái Đất", "is_correct": null },
          { "id": 4, "content": "Sao Hỏa", "is_correct": null }
        ]
      }
    }
  }
}
```
> **Lưu ý:** `is_correct = null` khi câu hỏi đang `open` (bảo mật). Khi câu hỏi `closed`, `is_correct` trả về `true/false` thật.

**Khi game pending (chờ bắt đầu):**
```json
{
  "data": {
    "status": "pending",
    "current_round": null,
    "teams": [...]
  }
}
```

**Khi không có câu hỏi nào đang mở (giữa các câu):**
```json
{
  "data": {
    "status": "active",
    "current_round": {
      "current_question": null
    }
  }
}
```

---

### GET `/games/{id}/leaderboard`
Bảng xếp hạng tổng kết của game.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "team_id": 1,
      "team_name": "Neon Knights",
      "correct_count": 25,
      "total_time_seconds": 45.20
    },
    {
      "rank": 2,
      "team_id": 2,
      "team_name": "Data Demons",
      "correct_count": 24,
      "total_time_seconds": 48.00
    }
  ]
}
```
> **Ranking logic:** Sắp xếp theo `correct_count` DESC, sau đó `total_time_seconds` ASC.

---

### POST `/games/submit`
> **Auth:** `Bearer {player-token}` (token nhận được khi join)

Player nộp câu trả lời.

**Request body:**
```json
{
  "round_question_id": 5,
  "answer_id": 1
}
```
**Validation:**
- `round_question_id` — required, integer, exists in round_questions
- `answer_id` — required, integer, exists in answers
- Câu hỏi phải đang ở trạng thái `open`
- Mỗi team chỉ được nộp 1 lần (DB constraint + DB transaction)

**Response 200:**
```json
{
  "success": true,
  "message": "Answer submitted",
  "data": null
}
```
**Errors:**
- `409` — Đã nộp câu trả lời cho câu hỏi này rồi (idempotent — FE nên treat 409 như success)
- `422` — Câu hỏi đã đóng hoặc validation fail

---

## 5. Game Flow — Admin

> Tất cả đều yêu cầu `Bearer {admin-token}`

### GET `/admin/games/{id}/state`
Trạng thái game đầy đủ cho admin — bao gồm thông tin submission của từng đội.

> **Lưu ý sử dụng:** `AdminGameControl` dùng endpoint này theo cơ chế **polling 2 giây** (không dùng WebSocket) để luôn có dữ liệu `team_submissions` đầy đủ.

**Response 200:** Giống `GET /games/{id}/state` nhưng:
- `is_correct` luôn trả về giá trị thật (kể cả khi câu đang `open`)
- `current_question` có thêm field `team_submissions`:
```json
{
  "data": {
    "current_round": {
      "current_question": {
        "round_question_id": 5,
        "answers": [
          { "id": 1, "content": "Sao Mộc", "is_correct": true },
          ...
        ],
        "team_submissions": [
          {
            "team_id": 1,
            "team_name": "Neon Knights",
            "submitted": true,
            "is_correct": true
          },
          {
            "team_id": 2,
            "team_name": "Data Demons",
            "submitted": false,
            "is_correct": null
          }
        ]
      }
    }
  }
}
```

---

### POST `/admin/games/{id}/start`
Bắt đầu game (chuyển từ `pending` → `active`).

> **Side effect:** Dispatch WebSocket event `GameStarted` đến tất cả clients.

**Precondition:** `game.status === "pending"`  
**Response 200:**
```json
{
  "success": true,
  "message": "Game started",
  "data": { /* admin game state */ }
}
```
**Errors:**
- `422` — Game không ở trạng thái pending

---

### POST `/admin/games/{id}/start-round`
Bắt đầu vòng tiếp theo (lấy round `pending` đầu tiên theo `round_number`).

**Precondition:** Không có round nào đang `active`; nếu `question_mode = random`, tự động assign câu hỏi ngẫu nhiên cho round này.  
**Response 200:**
```json
{
  "success": true,
  "message": "Round started",
  "data": { /* admin game state */ }
}
```
**Errors:**
- `422` — Game không active, hoặc đang có round khác active, hoặc không còn round pending

---

### POST `/admin/games/{id}/open-question`
Mở câu hỏi tiếp theo trong round đang active (câu `pending` đầu tiên theo `order_number`).

> **Side effect:** Dispatch WebSocket event `QuestionStarted` đến tất cả clients.

**Precondition:** Không có câu nào đang `open`  
**Response 200:**
```json
{
  "success": true,
  "message": "Question opened",
  "data": { /* admin game state */ }
}
```
**Errors:**
- `422` — Đang có câu hỏi open, hoặc không còn câu pending trong round này

---

### POST `/admin/games/{id}/close-question`
Đóng câu hỏi đang mở (chuyển `open` → `closed`, ghi `closed_at`).

> **Side effect:** Dispatch WebSocket event `QuestionClosed` — lúc này `is_correct` được reveal cho tất cả clients.

**Precondition:** Có đúng 1 câu hỏi đang `open`  
**Response 200:**
```json
{
  "success": true,
  "message": "Question closed",
  "data": { /* admin game state — is_correct được reveal */ }
}
```
**Errors:**
- `422` — Không có câu hỏi nào đang open

---

### POST `/admin/games/{id}/finish-round`
Kết thúc vòng đang active (chuyển `active` → `finished`).

> **Side effect:** Dispatch WebSocket event `RoundFinished` — màn chiếu tự navigate về leaderboard.

**Precondition:** Có round đang `active`  
**Response 200:**
```json
{
  "success": true,
  "message": "Round finished",
  "data": { /* admin game state */ }
}
```
**Errors:**
- `422` — Không có round nào active

---

### POST `/admin/games/{id}/finish`
Kết thúc toàn bộ game (chuyển `active` → `finished`).

> **Side effect:** Dispatch WebSocket event `GameFinished` — tất cả clients tự navigate về màn kết thúc.

**Precondition:** `game.status === "active"`  
**Response 200:**
```json
{
  "success": true,
  "message": "Game finished",
  "data": { /* admin game state */ }
}
```
**Errors:**
- `422` — Game không ở trạng thái active

---

## 6. WebSocket Events (Reverb)

> **Cơ sở hạ tầng:** Laravel Reverb (port 8080) + Laravel Echo (pusher-js) trên FE  
> **Channel:** `game.{gameId}` — public channel, tất cả clients trong game đều subscribe  
> **Kết nối FE:** `src/sockets/echo.ts` → `getGameChannel(gameId)` → `channel.listen(".event.name", handler)`

### Danh sách events

| Event (BE class) | Event name (FE listener) | Trigger | Channels |
|---|---|---|---|
| `TeamJoined` | `.team.joined` | Player join thành công | `game.{gameId}` |
| `GameStarted` | `.game.started` | Admin nhấn Start Game | `game.{gameId}`, `stage`, `admin` |
| `QuestionStarted` | `.question.started` | Admin nhấn Open Question | `game.{gameId}`, `stage`, `admin` |
| `QuestionClosed` | `.question.closed` | Admin nhấn Close Question | `game.{gameId}`, `stage`, `admin` |
| `RoundFinished` | `.round.finished` | Admin nhấn Finish Round | `game.{gameId}`, `stage`, `admin` |
| `GameFinished` | `.game.finished` | Admin nhấn Finish Game | `game.{gameId}`, `stage`, `admin` |

---

### Event Payloads

#### `.team.joined`
```json
{
  "team": {
    "id": 7,
    "name": "Neon Knights"
  }
}
```

#### `.game.started`
```json
{
  "game_id": 1,
  "status": "active"
}
```

#### `.question.started`
```json
{
  "round_question_id": 5,
  "order_number": 3,
  "time_limit_seconds": 20,
  "question": {
    "content": "Hành tinh lớn nhất Hệ Mặt Trời?",
    "answers": [
      { "id": 1, "content": "Sao Mộc" },
      { "id": 2, "content": "Sao Thổ" },
      { "id": 3, "content": "Trái Đất" },
      { "id": 4, "content": "Sao Hỏa" }
    ]
  }
}
```
> **Lưu ý:** `is_correct` **không có** trong payload này — bảo mật, chỉ reveal khi `question.closed`.

#### `.question.closed`
```json
{
  "question": {
    "round_question_id": 5,
    "answers": [
      { "id": 1, "content": "Sao Mộc", "is_correct": true },
      { "id": 2, "content": "Sao Thổ", "is_correct": false },
      { "id": 3, "content": "Trái Đất", "is_correct": false },
      { "id": 4, "content": "Sao Hỏa", "is_correct": false }
    ]
  }
}
```

#### `.round.finished`
```json
{
  "round_number": 1
}
```

#### `.game.finished`
```json
{
  /* full game object */
}
```

---

### Cơ chế FE

```typescript
// Khởi tạo kết nối
const channel = getGameChannel(String(gameId)); // từ src/sockets/echo.ts

// Lắng nghe events
channel.listen(".question.started", (data: QuestionStartedEvent) => { ... });
channel.listen(".question.closed",  (data: QuestionClosedEvent)  => { ... });

// Cleanup khi component unmount
getEcho().leave(`game.${gameId}`);
```

### Màn hình sử dụng WebSocket

| Màn hình | Events lắng nghe | Ghi chú |
|---|---|---|
| `PlayerWaiting` | `.team.joined`, `.game.started` | Initial state từ API, sau đó WS |
| `PlayerGame` | `.question.started`, `.question.closed`, `.game.finished` | Initial state từ API, sau đó WS |
| `StageWaitting` | `.team.joined`, `.question.started`, `.game.finished` | Initial state từ API, sau đó WS |
| `StageGame` | `.question.started`, `.question.closed`, `.round.finished`, `.game.finished` | Hoàn toàn WS-driven |
| `AdminGameControl` | — | Dùng polling 2s (không dùng WS) |
| `StageLeaderBoard` | — | Chỉ gọi API một lần |

---

## 7. APIs cần tạo mới (PLANNED)

### 7.1 GET `/admin/questions/{id}` — Xem chi tiết câu hỏi
> **Độ ưu tiên:** 🟡 Trung bình | **Task:** F9

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "Thủ đô của Việt Nam?",
    "type": "single_choice",
    "time_limit_seconds": 30,
    "answers": [
      { "id": 1, "content": "Hà Nội", "is_correct": true },
      { "id": 2, "content": "TP.HCM", "is_correct": false }
    ]
  }
}
```

---

### 7.2 PUT `/admin/questions/{id}` — Cập nhật câu hỏi
> **Độ ưu tiên:** 🟡 Trung bình | **Task:** F8

**Request body (partial update):**
```json
{
  "content": "Thủ đô nào lớn nhất Đông Nam Á?",
  "time_limit_seconds": 25,
  "answers": [
    { "id": 1, "content": "Hà Nội", "is_correct": false },
    { "id": 2, "content": "Jakarta", "is_correct": true },
    { "id": 3, "content": "Bangkok", "is_correct": false },
    { "id": 4, "content": "Manila", "is_correct": false }
  ]
}
```
**Validation:** Tương tự POST, bắt buộc đúng 1 đáp án đúng.

---

### 7.3 GET `/games/{id}/rounds/{roundNumber}/leaderboard` — Leaderboard theo vòng
> **Độ ưu tiên:** 🔴 Cao | **Task:** F6, F14

Cần cho `StageRoundComplete` và hiển thị kết quả từng vòng.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "round_number": 1,
    "entries": [
      {
        "rank": 1,
        "team_id": 1,
        "team_name": "Neon Knights",
        "correct_count": 8,
        "total_time_seconds": 14.50
      }
    ]
  }
}
```

---

### 7.4 GET `/admin/games/{id}/statistics` — Thống kê game
> **Độ ưu tiên:** 🟡 Trung bình | **Task:** F15

Dùng cho Admin Dashboard.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "game_id": 1,
    "total_teams": 12,
    "total_submissions": 360,
    "overall_correct_rate": 67.5,
    "rounds": [
      {
        "round_number": 1,
        "questions": [
          {
            "order_number": 1,
            "content": "Thủ đô Việt Nam?",
            "correct_rate": 91.7,
            "avg_response_time_seconds": 3.2
          }
        ]
      }
    ]
  }
}
```

---

### 7.5 GET `/admin/games/{id}/export` — Export kết quả game ra CSV
> **Độ ưu tiên:** 🟡 Trung bình | **Task:** F13

**Response:** File download `text/csv`  
**Content:**
```
rank,team_name,correct_count,total_time_seconds
1,Neon Knights,25,45.20
2,Data Demons,24,48.00
```

---

### 7.6 POST `/admin/games/{id}/reset` — Reset game về pending
> **Độ ưu tiên:** 🟢 Thấp | **Task:** F23

Reset game để chơi lại: xóa submissions, đặt lại trạng thái rounds và round_questions.

**Request body:** Không có  
**Response 200:**
```json
{
  "success": true,
  "message": "Game reset to pending",
  "data": null
}
```

---

### 7.7 Auto-close câu hỏi khi hết giờ (Internal)
> **Độ ưu tiên:** 🔴 Cao | **Task:** F5

Hiện tại admin phải đóng câu hỏi thủ công. Cần implement Laravel Queue Job để tự động đóng sau `time_limit_seconds`.

**Cơ chế đề xuất:**
```php
// Trong GameService::openNextQuestion()
dispatch(new AutoCloseQuestionJob($rq->id))
    ->delay(now()->addSeconds($question->time_limit_seconds));
```
Yêu cầu: `QUEUE_CONNECTION=database` và `php artisan queue:work` chạy trong container.

---

## 8. Game State Machine

### Game Status
```
pending ──[admin: start]──► active ──[admin: finish]──► finished
```

### Round Status
```
pending ──[admin: start-round]──► active ──[admin: finish-round]──► finished
```

### RoundQuestion Status
```
pending ──[admin: open-question]──► open ──[admin: close-question / auto-close]──► closed
```

### Luồng hoàn chỉnh
```
1. Admin tạo phòng (POST /admin/rooms)
2. Player quét QR → join phòng (POST /rooms/{code}/join)
   → WS event: .team.joined broadcast đến lobby
3. Admin bắt đầu game (POST /admin/games/{id}/start)
   → WS event: .game.started → PlayerWaiting & StageWaitting tự navigate
4. Lặp cho mỗi vòng:
   4a. Admin bắt đầu vòng (POST /admin/games/{id}/start-round)
   4b. Lặp cho mỗi câu hỏi:
       4b1. Admin mở câu hỏi (POST /admin/games/{id}/open-question)
            → WS event: .question.started → PlayerGame & StageGame hiển thị câu hỏi + countdown
       4b2. Players nộp bài (POST /games/submit) — trong time_limit_seconds
       4b3. Admin đóng câu hỏi (POST /admin/games/{id}/close-question)
            → WS event: .question.closed → PlayerGame & StageGame reveal đáp án đúng
   4c. Admin kết thúc vòng (POST /admin/games/{id}/finish-round)
       → WS event: .round.finished → StageGame navigate về /stage/leaderboard
   4d. Màn chiếu hiển thị leaderboard vòng (StageLeaderBoard gọi API)
5. Admin kết thúc game (POST /admin/games/{id}/finish)
   → WS event: .game.finished → tất cả clients navigate về màn kết thúc
6. Màn chiếu hiển thị Final leaderboard (StageFinal)
```

---

## 9. Frontend API Clients

### Service files (`quiz-fe/src/services/`)

| File | Endpoints |
|------|-----------|
| `authService.ts` | adminLogin, adminLogout |
| `questionService.ts` | getQuestions, createQuestion, deleteQuestion, importQuestions |
| `roomService.ts` | getRooms, createRoom, deleteRoom |
| `gameService.ts` | getPublicGameState, getLeaderboard, submitAnswer, getAdminGameState, startGame, startRound, openQuestion, closeQuestion, finishRound, finishGame |

### WebSocket (`quiz-fe/src/sockets/`)

| File | Mục đích |
|------|----------|
| `echo.ts` | Khởi tạo Laravel Echo instance, export `getEcho()`, `getGameChannel(id)` |

### Axios instance (`src/services/api.ts`)
- Base URL: `VITE_API_BASE_URL`
- Auto-attach `Authorization: Bearer {token}` từ Zustand `useAuthStore`
- On 401: clear auth + redirect về `/admin/login` hoặc `/join` tùy role

### Kiến trúc Real-time

```
Components cần real-time:
  PlayerWaiting, PlayerGame  ──► WebSocket (game.{gameId} channel)
  StageWaitting, StageGame   ──► WebSocket (game.{gameId} channel)
  AdminGameControl            ──► Polling 2s (HTTP GET /admin/games/{id}/state)
  StageLeaderBoard            ──► HTTP one-shot (GET /games/{id}/leaderboard)
```

---

## 10. Error Response Format

```json
{
  "success": false,
  "code": 422,
  "message": "Thông điệp lỗi",
  "data": null
}
```

| HTTP Code | Ý nghĩa | Ví dụ |
|-----------|---------|-------|
| `200` | Thành công | — |
| `201` | Tạo mới thành công | Tạo câu hỏi, tạo phòng |
| `401` | Chưa xác thực | Token hết hạn hoặc thiếu |
| `404` | Không tìm thấy | Game ID không tồn tại |
| `409` | Conflict | Đã nộp bài cho câu hỏi này |
| `422` | Validation / Business logic fail | Game không ở trạng thái phù hợp |
| `500` | Lỗi server | Lỗi không mong muốn |
