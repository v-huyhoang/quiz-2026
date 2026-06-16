# Quiz Stack 2026 — API Documentation

> **Base URL:** `http://localhost:8000/api`
> **Auth:** Laravel Sanctum — header `Authorization: Bearer {token}`
> **Response format:**
> ```json
> { "success": true, "code": 200, "message": "...", "data": {...} }
> ```
> **Cập nhật:** 2026-05-31

---

## Mục lục

1. [Auth](#1-auth)
2. [Questions](#2-questions)
3. [Rooms (Admin)](#3-rooms-admin)
4. [Game Flow — Public](#4-game-flow--public)
5. [Game Flow — Player](#5-game-flow--player)
6. [Game Flow — Admin](#6-game-flow--admin)
7. [WebSocket Events (Reverb)](#7-websocket-events-reverb)
8. [Game State Machine](#8-game-state-machine)
9. [Error Responses](#9-error-responses)

---

## 1. Auth

### POST `/admin/login`
Đăng nhập admin, trả về Sanctum token.

**Request:**
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
    "token": "1|abc123...",
    "admin": {
      "id": 1,
      "name": "Admin",
      "email": "admin@quiz.com"
    }
  }
}
```

---

### POST `/admin/logout`
`Auth: admin-token`

Revoke token hiện tại.

**Response 200:** `{ "data": null }`

---

## 2. Questions

### GET `/admin/questions`
`Auth: admin-token`

Lấy danh sách câu hỏi, phân trang 20 per page.

**Query params:** `?page=1`

**Response 200:**
```json
{
  "data": {
    "data": [
      {
        "id": "1",
        "text": "Câu hỏi là gì?",
        "totalTime": 30,
        "options": [
          { "id": "1", "text": "Đáp án A", "isCorrect": false },
          { "id": "2", "text": "Đáp án B", "isCorrect": true },
          { "id": "3", "text": "Đáp án C", "isCorrect": false },
          { "id": "4", "text": "Đáp án D", "isCorrect": false }
        ]
      }
    ],
    "current_page": 1,
    "last_page": 5,
    "total": 100
  }
}
```

---

### POST `/admin/questions`
`Auth: admin-token`

Tạo câu hỏi mới. Phải có đúng 1 option có `isCorrect: true`.

**Request:**
```json
{
  "text": "Thủ đô của Việt Nam là?",
  "totalTime": 30,
  "options": [
    { "text": "Hà Nội", "isCorrect": true },
    { "text": "TP.HCM", "isCorrect": false },
    { "text": "Đà Nẵng", "isCorrect": false },
    { "text": "Huế", "isCorrect": false }
  ]
}
```

**Response 201:**
```json
{
  "data": {
    "id": "42",
    "text": "Thủ đô của Việt Nam là?",
    "totalTime": 30,
    "options": [
      { "id": "101", "text": "Hà Nội", "isCorrect": true },
      { "id": "102", "text": "TP.HCM", "isCorrect": false },
      { "id": "103", "text": "Đà Nẵng", "isCorrect": false },
      { "id": "104", "text": "Huế", "isCorrect": false }
    ]
  }
}
```

---

### DELETE `/admin/questions/{id}`
`Auth: admin-token`

**Response 200:** `{ "data": null }`

---

### POST `/admin/questions/import`
`Auth: admin-token`

Import hàng loạt từ file CSV hoặc XLSX (max 500 dòng).

**Request:** `multipart/form-data`
```
file: <file.csv hoặc file.xlsx>
```

**CSV format:**
```
question_text,time_limit,answer_a,answer_b,answer_c,answer_d,correct_answer
"Câu hỏi 1",30,"A","B","C","D","B"
```

**Response 200:**
```json
{
  "data": {
    "imported": 25,
    "skipped": 2,
    "errors": ["Row 3: missing correct answer"]
  }
}
```

---

## 3. Rooms (Admin)

### GET `/admin/rooms`
`Auth: admin-token`

Lấy tất cả games (không phân trang).

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Demo Quiz",
      "access_code": "DEMO01",
      "status": "pending",
      "rounds": 3,
      "questions_per_round": 5,
      "question_mode": "random",
      "started_at": null,
      "ended_at": null
    }
  ]
}
```

---

### POST `/admin/rooms`
`Auth: admin-token`

Tạo room mới. BE tự động tạo `rounds` và `round_questions`.

**Request:**
```json
{
  "name": "Quiz Night 2026",
  "rounds": 3,
  "questions_per_round": 5,
  "access_code": "NIGHT01",
  "question_mode": "random"
}
```

> Với `question_mode: "manual"`, thêm field:
> ```json
> "round_questions": [
>   { "round_number": 1, "question_ids": [1, 2, 3, 4, 5] },
>   { "round_number": 2, "question_ids": [6, 7, 8, 9, 10] }
> ]
> ```

**Response 201:**
```json
{
  "data": {
    "id": 5,
    "name": "Quiz Night 2026",
    "access_code": "NIGHT01",
    "status": "pending",
    "rounds": 3,
    "questions_per_round": 5,
    "question_mode": "random",
    "join_url": "http://localhost:5173/join?room=NIGHT01"
  }
}
```

---

### GET `/admin/rooms/{id}`
`Auth: admin-token`

**Response 200:** Chi tiết room bao gồm danh sách câu hỏi đã gán.

---

### PUT `/admin/rooms/{id}`
`Auth: admin-token`

Cập nhật tên, rounds hoặc danh sách câu hỏi.

---

### DELETE `/admin/rooms/{id}`
`Auth: admin-token`

Xóa room. Cascade xóa tất cả rounds, round_questions, submissions.

> Không thể xóa game đang ở trạng thái `active`.

---

### GET `/rooms/code/{code}`
Public. Lấy thông tin room theo access_code (để FE hiển thị tên room trước khi join).

**Response 200:**
```json
{
  "data": {
    "id": 5,
    "name": "Quiz Night 2026",
    "access_code": "NIGHT01",
    "status": "pending"
  }
}
```

---

## 4. Game Flow — Public

### POST `/rooms/{code}/join`
Player join phòng bằng mã phòng.

**Request:**
```json
{ "team_name": "Team Alpha" }
```

**Response 200:**
```json
{
  "data": {
    "token": "5|player_token_abc...",
    "team_id": 7,
    "team_name": "Team Alpha",
    "game_id": 5,
    "room": {
      "id": 5,
      "name": "Quiz Night 2026",
      "access_code": "NIGHT01"
    }
  }
}
```

**Errors:**
- `404` — Room không tồn tại
- `422` — Game đã bắt đầu (status ≠ pending), hoặc tên team đã tồn tại

**WebSocket broadcast:**
```
Channel: game.5
Event:   team.joined
Payload: { "game_id": 5, "team": { "id": 7, "name": "Team Alpha" } }
```

---

### GET `/games/{id}/state`
Public. State hiện tại của game. Dùng cho polling fallback và initial load.

**Response 200:**
```json
{
  "data": {
    "status": "active",
    "name": "Quiz Night 2026",
    "access_code": "NIGHT01",
    "rounds_total": 3,
    "questions_per_round": 5,
    "teams": [
      { "id": 1, "name": "Team Alpha" },
      { "id": 2, "name": "Team Beta" }
    ],
    "current_round": {
      "round_number": 1,
      "status": "active",
      "questions_done": 2,
      "total_questions": 5,
      "current_question": {
        "round_question_id": 42,
        "order_number": 3,
        "content": "Thủ đô Pháp là?",
        "status": "open",
        "opened_at": "2026-05-31T10:30:00.000Z",
        "time_limit_seconds": 30,
        "answers": [
          { "id": 1, "content": "London", "is_correct": null },
          { "id": 2, "content": "Paris", "is_correct": null },
          { "id": 3, "content": "Berlin", "is_correct": null },
          { "id": 4, "content": "Madrid", "is_correct": null }
        ]
      }
    }
  }
}
```

> `teams` chỉ gồm những team có `is_present = true`.
> `is_correct` luôn là `null` khi câu hỏi đang mở.

---

### GET `/games/{id}/leaderboard`
Public.

**Response 200:**
```json
{
  "data": [
    { "rank": 1, "team_id": 1, "team_name": "Team Alpha", "correct_count": 8, "total_time_seconds": 45.2 },
    { "rank": 2, "team_id": 2, "team_name": "Team Beta",  "correct_count": 7, "total_time_seconds": 52.1 }
  ]
}
```

> Ranking: correct_count DESC → total_time_seconds ASC

---

### GET `/games/{id}/round-results`
Public. Kết quả theo từng vòng (top 20 team mỗi vòng). Dùng cho màn hình waiting giữa vòng và màn hình game kết thúc.

**Response 200:**
```json
{
  "data": [
    {
      "round_number": 1,
      "top_teams": [
        { "rank": 1, "team_id": 1, "team_name": "Team Alpha", "correct_count": 5, "total_time_seconds": 42.3 },
        { "rank": 2, "team_id": 2, "team_name": "Team Beta",  "correct_count": 4, "total_time_seconds": 38.1 }
      ]
    },
    {
      "round_number": 2,
      "top_teams": [...]
    }
  ]
}
```

> Trả về tất cả các vòng của game, kể cả vòng chưa có submission nào (`top_teams: []`).

---

## 5. Game Flow — Player

### POST `/games/submit`
`Auth: player-token`

Nộp đáp án. Chỉ được nộp 1 lần per câu hỏi.

**Request:**
```json
{
  "round_question_id": 42,
  "answer_id": 2,
  "response_time_ms": 8350
}
```

> `response_time_ms` là thời gian tính từ lúc client nhận `.question.started` đến lúc nhấn submit (milliseconds). Là optional — nếu thiếu, BE tự tính từ `round_question.opened_at`.

**Response 200:**
```json
{
  "data": { "is_correct": true }
}
```

> FE dùng `is_correct` để hiển thị phản hồi đúng/sai ngay lập tức, và để quyết định có lưu vào localStorage không.

**Errors:**
- `409` — Đã nộp câu này rồi (duplicate)
- `422` — Câu hỏi chưa mở hoặc đã đóng

---

### POST `/games/{id}/leave`
`Auth: player-token`

Đánh dấu team là `is_present = false`.

**Response 200:** `{ "data": null }`

---

### POST `/games/{id}/announce`
`Auth: player-token`

Đánh dấu team là `is_present = true` (dùng khi reconnect).

**Response 200:** `{ "data": null }`

---

## 6. Game Flow — Admin

Tất cả routes bên dưới đều `Auth: admin-token`.

> Admin state có thêm `team_submissions` trong `current_question`:
> ```json
> "team_submissions": [
>   { "team_id": 1, "team_name": "Team Alpha", "submitted": true,  "is_correct": true  },
>   { "team_id": 2, "team_name": "Team Beta",  "submitted": false, "is_correct": null  }
> ]
> ```

---

### GET `/admin/games/{id}/state`
Giống public state nhưng có `team_submissions`.

---

### GET `/admin/games/{id}/round-results`
Giống public `/games/{id}/round-results` nhưng yêu cầu `admin-token`.

---

### POST `/admin/games/{id}/start`
Game: `pending` → `active`. Broadcast `game.started`.

**Precondition:** game.status == `pending`

---

### POST `/admin/games/{id}/start-round`
Round tiếp theo: `pending` → `active`. Tự động mở câu hỏi đầu tiên. Broadcast `question.started`.

**Precondition:** game.status == `active`, có round ở trạng thái `pending`

---

### POST `/admin/games/{id}/open-question`
Mở câu hỏi `pending` tiếp theo trong round hiện tại. Broadcast `question.started`.

**Precondition:** Không có câu hỏi nào đang `open`

---

### POST `/admin/games/{id}/close-question`
Đóng câu hỏi đang `open`. Broadcast `question.closed` (lộ `is_correct`).

**Precondition:** Có câu hỏi đang `open`

---

### POST `/admin/games/{id}/finish-round`
Round: `active` → `finished`. Broadcast `round.finished`.

**Precondition:** Tất cả câu hỏi trong round đều `closed`

---

### POST `/admin/games/{id}/finish`
Game: `active` → `finished`. Broadcast `game.finished`.

**Precondition:** game.status == `active`

---

## 7. WebSocket Events (Reverb)

**Config FE:**
```
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
VITE_REVERB_APP_KEY=quiz_app_key_dev
```

**Channels:**
| Channel | Auth | Dùng bởi |
|---|---|---|
| `game.{gameId}` | Public | Player, Stage, Admin |
| `presence-game.{gameId}` | Team của game đó | Player waiting room |
| `stage` | Public | Stage display |
| `admin` | Admin only | Admin panel |

---

### `.game.started`
```json
{ "game_id": 5, "status": "active", "rounds_total": 3 }
```

---

### `.game.finished`
```json
{ "game_id": 5, "status": "finished" }
```

---

### `.question.started`
`is_correct` = `null` (ẩn đáp án khi đang mở).
```json
{
  "round_question_id": 42,
  "round_id": 10,
  "game_id": 5,
  "round_number": 1,
  "total_questions": 5,
  "order_number": 3,
  "time_limit_seconds": 30,
  "opened_at": "2026-05-31T10:30:00.123Z",
  "question": {
    "id": 99,
    "content": "Thủ đô Pháp là?",
    "time_limit_seconds": 30,
    "answers": [
      { "id": 1, "content": "London", "is_correct": null },
      { "id": 2, "content": "Paris",  "is_correct": null },
      { "id": 3, "content": "Berlin", "is_correct": null },
      { "id": 4, "content": "Madrid", "is_correct": null }
    ]
  }
}
```

> `opened_at` là timestamp server (ISO 8601) lúc câu hỏi được mở. FE dùng giá trị này để tính `response_time_ms` chính xác, tránh lệch giờ giữa client và server.

---

### `.question.closed`
`is_correct` được reveal.
```json
{
  "round_question_id": 42,
  "game_id": 5,
  "question": {
    "id": 99,
    "content": "Thủ đô Pháp là?",
    "time_limit_seconds": 30,
    "answers": [
      { "id": 1, "content": "London", "is_correct": false },
      { "id": 2, "content": "Paris",  "is_correct": true  },
      { "id": 3, "content": "Berlin", "is_correct": false },
      { "id": 4, "content": "Madrid", "is_correct": false }
    ]
  }
}
```

---

### `.round.finished`
```json
{ "game_id": 5, "round_number": 1 }
```

---

### `.team.joined`
```json
{ "game_id": 5, "team": { "id": 7, "name": "Team Alpha" } }
```

---

### `.team.left`
Trigger: player gọi `/games/{id}/leave` hoặc Reverb webhook `member_removed`.
```json
{ "game_id": 5, "team": { "id": 7, "name": "Team Alpha" } }
```

---

## 8. Game State Machine

```
                    startGame()
game:  pending ─────────────────► active ──── finishGame() ──► finished


                      startRound()                    finishRound()
round: pending ──────────────────► active ────────────────────► finished
                                     │
                         auto: openQuestion()
                                     │
                    openQuestion()   ▼         closeQuestion()
rq:    pending ──────────────────► open ──────────────────────► closed
                                                  (lặp lại cho câu tiếp)
```

**Quy tắc:**
- `startRound()` tự động gọi `openQuestion()` → broadcast `question.started` ngay
- `openQuestion()` chỉ hoạt động khi không có câu nào đang `open`
- `finishRound()` chỉ hoạt động khi tất cả câu đều `closed`
- Mỗi câu hỏi chỉ được submit 1 lần (UNIQUE constraint trên DB)

---

## 9. Error Responses

```json
{ "success": false, "code": 1, "message": "Game not found" }
```

| HTTP | code | Tình huống |
|---|---|---|
| 401 | — | Token không hợp lệ hoặc hết hạn |
| 404 | 1 | Resource không tồn tại |
| 409 | — | Duplicate (đã submit câu này) |
| 422 | — | Validation lỗi hoặc state không hợp lệ |
| 500 | — | Server error |

**422 format:**
```json
{
  "success": false,
  "code": 422,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```
