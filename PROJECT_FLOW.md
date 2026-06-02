# Quiz Stack 2026 — Báo cáo Flow Dự án

> Tài liệu mô tả chi tiết kiến trúc, flow hoạt động, và game logic của hệ thống.

---

## 1. Tổng quan kỹ thuật

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State | Zustand 5 |
| Routing | React Router 7 |
| HTTP | Axios (interceptors) |
| Real-time | Laravel Echo + Pusher.js → Reverb WebSocket |
| Backend | Laravel 12 (PHP 8.3) |
| Auth | Laravel Sanctum (token-based) |
| Database | MySQL 8 |
| WebSocket server | Laravel Reverb (port 8080) |

---

## 2. Cấu trúc thư mục Frontend

```
quiz-fe/src/
├── apps/
│   ├── admin/                     # Màn hình admin
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminRoom.tsx
│   │   ├── AdminQuestion.tsx
│   │   ├── AdminGameControl.tsx   # Điều khiển game trực tiếp
│   │   ├── AdminRoomDetail.tsx
│   │   └── parts/Navbar.tsx
│   ├── player/                    # Màn hình player
│   │   ├── JoinRoom.tsx
│   │   ├── PlayerWaiting.tsx
│   │   ├── PlayerGame.tsx
│   │   └── PlayerLayout.tsx
│   └── stage/                     # Màn hình hiển thị (máy chiếu)
│       ├── StageGame.tsx
│       ├── StageLeaderBoard.tsx
│       ├── StageFinal.tsx
│       ├── StageRoundComplete.tsx
│       ├── StageWaitting.tsx
│       └── StageLayout.tsx
├── components/
│   ├── guards/
│   │   ├── AdminGuard.tsx
│   │   └── PlayerGuard.tsx
│   └── ui/
│       ├── QuestionTimer.tsx
│       ├── LoadingScreen.tsx
│       └── GridBg.tsx
├── hooks/
│   ├── useGameSocket.ts
│   └── useCountdown.ts
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── gameService.ts
│   ├── roomService.ts
│   └── questionService.ts
├── store/
│   ├── authStore.ts
│   └── gameStore.ts
├── sockets/
│   ├── echo.ts
│   └── channels/game-channel.ts
├── type/
│   ├── game.ts
│   ├── room.ts
│   ├── question.ts
│   ├── pagination.ts
│   └── api.ts
├── libs/utils.ts
├── routes/AppRoutes.tsx
└── main.tsx
```

---

## 3. Router & Phân quyền truy cập

| Path | Component | Guard | Truy cập |
|---|---|---|---|
| `/` hoặc `/join` | `JoinRoom` | — | Public |
| `/player/waiting` | `PlayerWaiting` | `PlayerGuard` | Player |
| `/player/game` | `PlayerGame` | `PlayerGuard` | Player |
| `/stage/waiting` | `StageWaitting` | — | Public |
| `/stage/question` | `StageGame` | — | Public |
| `/stage/leaderboard` | `StageLeaderBoard` | — | Public |
| `/stage/round-complete` | `StageRoundComplete` | — | Public |
| `/stage/final` | `StageFinal` | — | Public |
| `/admin/login` | `AdminLogin` | — | Public |
| `/admin` | `AdminDashboard` | `AdminGuard` | Admin |
| `/admin/rooms` | `AdminRoom` | `AdminGuard` | Admin |
| `/admin/question` | `AdminQuestion` | `AdminGuard` | Admin |
| `/admin/game-control/:gameId` | `AdminGameControl` | `AdminGuard` | Admin |
| `/admin/leaderboard` | `StageLeaderBoard` | `AdminGuard` | Admin |

**AdminGuard:** Kiểm tra `token && role === "admin"`. Fail → redirect `/admin/login`.

**PlayerGuard:** Kiểm tra `token && role === "player"`. Fail → redirect `/`.

---

## 4. State Management (Zustand)

### `authStore`

Lưu vào `localStorage["quiz-auth"]` qua persist middleware.

```typescript
{
  token: string | null,
  teamId: number | null,
  teamName: string | null,
  gameId: number | null,
  role: "player" | "admin" | null,
  setAuth(payload): void,
  clearAuth(): void,
  isAuthenticated(): boolean
}
```

### `gameStore`

Không persist (reset mỗi phiên để tránh stale state).

```typescript
{
  gameId: number | null,
  roundId: number | null,
  roundNumber: number | null,
  gameStatus: "waiting" | "active" | "finished",
  roundStatus: "waiting" | "active" | "finished",
  questionStatus: "waiting" | "open" | "closed",
  currentQuestion: CurrentQuestion | null,
  submittedQuestionIds: number[],   // Tránh submit trùng
  leaderboard: LeaderboardEntry[] | null,

  setGame(gameId): void,
  setRound(roundId, roundNumber): void,
  setQuestion(question): void,
  setQuestionStatus(status): void,
  markSubmitted(questionId): void,
  hasSubmitted(questionId): boolean,
  reset(): void
}
```

---

## 5. WebSocket & Real-time

### Kênh WebSocket

| Kênh | Loại | Người nghe |
|---|---|---|
| `game.{gameId}` | Public | Player, Stage, Admin |
| `presence-game.{gameId}` | Presence (auth) | Player |

### Events

| Event | Payload | Ai xử lý |
|---|---|---|
| `.team.joined` | `{ team: { id, name } }` | PlayerWaiting, AdminGameControl |
| `.team.left` | `{ team: { id } }` | PlayerWaiting, AdminGameControl |
| `.game.started` | `{ game_id, rounds_total }` | PlayerWaiting, PlayerGame, StageGame, AdminGameControl |
| `.question.started` | `{ round_question_id, order_number, question, opened_at, time_limit_seconds }` | PlayerGame, StageGame, AdminGameControl |
| `.question.closed` | `{ question: { answers } }` (có `is_correct`) | PlayerGame, StageGame, AdminGameControl |
| `.round.finished` | `{ round_number }` | PlayerGame, StageGame |
| `.game.finished` | — | PlayerGame, StageGame |

### Cấu hình Echo (`sockets/echo.ts`)

- **Unauthenticated Echo:** Dùng cho public channels (Stage display)
- **Player Echo:** Kèm player token → dùng cho presence channel
- Broadcaster: **Reverb** (tự host WebSocket tại port 8080)

---

## 6. API Endpoints

### Public
```
POST   /rooms/{code}/join          → { token, team_id, team_name, game_id, room }
GET    /games/{id}/state           → GameState
GET    /games/{id}/leaderboard     → LeaderboardEntry[]
GET    /games/{id}/round-results   → RoundResult[]
GET    /rooms/code/{code}          → { id, name, access_code, status }
```

### Player (Sanctum auth)
```
GET    /games/{id}/player-state    → GameState (có my_submission)
POST   /games/submit               → { is_correct: boolean }
POST   /games/{id}/leave           → null
POST   /games/{id}/announce        → null
```

### Admin (Sanctum auth)
```
POST   /admin/login                → { token, admin }
POST   /admin/logout               → null

# Rooms
GET    /admin/rooms                → Room[]
POST   /admin/rooms                → Room
GET    /admin/rooms/{id}           → Room (detailed)
PUT    /admin/rooms/{id}           → Room
DELETE /admin/rooms/{id}           → null

# Questions
GET    /admin/questions            → { data, meta } (paginated)
POST   /admin/questions            → Question
DELETE /admin/questions/{id}      → null
POST   /admin/questions/import    → { imported, skipped, errors }

# Game Control
GET    /admin/games/{id}/state
POST   /admin/games/{id}/start
POST   /admin/games/{id}/start-round
POST   /admin/games/{id}/open-question
POST   /admin/games/{id}/close-question
POST   /admin/games/{id}/finish-round
POST   /admin/games/{id}/finish
```

---

## 7. Game State Machine

### Game Status
```
pending ──→ active ──→ finished
```

### Round Status (trong mỗi game active)
```
pending ──→ active ──→ finished
           (lặp lại cho từng round)
```

### Question Status (trong mỗi round active)
```
pending ──→ open ──→ closed
           (lặp lại cho từng câu hỏi)
```

---

## 8. Flow chi tiết theo từng Role

---

### ROLE: ADMIN

#### 8.1 Đăng nhập

1. Truy cập `/admin/login`
2. Nhập email + password → POST `/admin/login`
3. Lưu `{ token, role: "admin" }` vào `authStore` + localStorage
4. Redirect → `/admin`

#### 8.2 Quản lý câu hỏi (`/admin/question`)

- Xem danh sách câu hỏi (phân trang)
- Thêm câu hỏi mới (4 đáp án, chọn 1 đáp án đúng, thời gian giới hạn)
- Xóa câu hỏi
- Import câu hỏi hàng loạt (file CSV/JSON)

#### 8.3 Quản lý phòng (`/admin/rooms`)

- Xem danh sách phòng
- Tạo phòng mới (tên, chọn câu hỏi/round, số vòng)
- Xóa phòng
- Xem kết quả game (modal với breakdown theo từng vòng)

#### 8.4 Điều khiển game trực tiếp (`/admin/game-control/:gameId`)

Đây là màn hình trung tâm. Admin thực hiện tuần tự:

```
[Bắt đầu game]
    → POST /admin/games/{id}/start
    → Broadcast .game.started
    → (auto start round 1)

[Mở câu hỏi]
    → POST /admin/games/{id}/open-question
    → Broadcast .question.started
    → Timer chạy ở frontend

[Theo dõi submissions]
    → Sidebar hiện real-time: team nào đã nộp, đúng/sai

[Đóng câu hỏi] (manual hoặc auto khi hết giờ)
    → POST /admin/games/{id}/close-question
    → Broadcast .question.closed (kèm đáp án đúng)

[Câu tiếp theo]
    → POST /admin/games/{id}/open-question (câu kế tiếp)

... (lặp cho hết câu) ...

[Kết thúc vòng]
    → POST /admin/games/{id}/finish-round
    → Broadcast .round.finished

[Bắt đầu vòng tiếp theo]
    → POST /admin/games/{id}/start-round

... (lặp cho hết vòng) ...

[Kết thúc game]
    → POST /admin/games/{id}/finish
    → Broadcast .game.finished
```

**Thông tin hiển thị trên AdminGameControl:**
- Status cards: vòng hiện tại, số team, câu đã làm, trạng thái câu hiện tại
- Nội dung câu hỏi + 4 đáp án (highlight đáp án đúng khi đã closed)
- Timer đếm ngược (đỏ khi < 5 giây)
- Sidebar: danh sách team đã nộp bài + kết quả đúng/sai

---

### ROLE: PLAYER

#### 8.5 Tham gia phòng (`/join`)

2 bước:
1. **Bước 1:** Nhập mã phòng (uppercase, auto-focus)
   - Hỗ trợ query param `?room=CODE` tự điền
2. **Bước 2:** Nhập tên đội (max 50 ký tự)

POST `/rooms/{code}/join` → nhận player token.

Xử lý lỗi:
- 404: Phòng không tồn tại
- 409: Phòng đã đầy
- 422: Tên đội đã có người dùng

`authStore.setAuth({ token, teamId, teamName, gameId, role: "player" })`

Redirect → `/player/waiting`

#### 8.6 Phòng chờ (`/player/waiting`)

- Subscribe WebSocket channel `game.{gameId}`
- Hiện danh sách team đã tham gia (real-time)
- Progress bar: số team / 16
- Lắng nghe event `.game.started` → tự động navigate `/player/game`

#### 8.7 Gameplay (`/player/game`)

**Khi nhận `.question.started`:**

1. Hiện câu hỏi + 4 đáp án
2. Timer đếm ngược
3. Player chọn 1 đáp án
4. Click "Chốt kèo" → POST `/games/submit`:
   ```json
   {
     "round_question_id": ...,
     "answer_id": ...,
     "response_time_ms": ...   // Tính: Date.now() - opened_at
   }
   ```
5. Backend validate: game active, round active, câu đang open, chưa timeout, chưa nộp trùng
6. Response: `{ is_correct: boolean }`
7. Hiện feedback (đúng/sai) ngay lập tức

**Khi nhận `.question.closed`:**

- Hiện breakdown đáp án (đáp án đúng highlight xanh)
- Nếu đúng: lưu vào `localStorage[quiz_correct_{gameId}_round_{roundNumber}]`

**Khi nhận `.round.finished`:**

- Hiện màn hình tóm tắt vòng (bao nhiêu câu đúng)
- Chờ vòng tiếp theo

**Khi nhận `.game.finished`:**

- Hiện màn hình kết quả cuối cùng với recap từng vòng

**Edge cases:**
- 409 từ submit (submit trùng) → refresh state từ API
- Câu đã submit: disable nút, không cho submit lại

---

### ROLE: STAGE (Màn hình hiển thị)

Không cần đăng nhập. Dùng public WebSocket.

| Route | Hiển thị |
|---|---|
| `/stage/waiting` | Đang chờ vòng tiếp theo |
| `/stage/question` | Câu hỏi hiện tại (font lớn, 2 cột đáp án) + timer |
| `/stage/leaderboard` | Bảng xếp hạng real-time |
| `/stage/round-complete` | Popup kết thúc vòng |
| `/stage/final` | Leaderboard cuối cùng + confetti animation |

`StageGame.tsx` tự điều hướng:
- Nhận `.game.finished` → navigate `/stage/final`
- Nhận `.round.finished` → hiện round complete popup

---

## 9. Data Models

### Game
```
id, name, access_code, status (pending|active|finished),
rounds_total, questions_per_round, created_at
```

### Round
```
id, game_id, round_number, status (pending|active|finished)
```

### RoundQuestion
```
id, round_id, question_id, order_number,
status (pending|open|closed), opened_at, closed_at
```

### Question
```
id, content, time_limit_seconds
```

### Answer
```
id, question_id, content, is_correct
```

### Team
```
id, game_id, name, is_present
```

### Submission
```
id, round_question_id, team_id, answer_id,
is_correct, response_time_ms
UNIQUE(round_question_id, team_id)   -- Chống duplicate
```

---

## 10. Scoring & Leaderboard

- **Nguồn truth:** Database (submissions table), không phải frontend
- **Xếp hạng theo:**
  1. `correct_count` DESC (nhiều câu đúng hơn = cao hơn)
  2. `total_time_seconds` ASC (cùng đúng → trả lời nhanh hơn = cao hơn)
- `response_time_ms` tính từ `opened_at` (lúc câu hỏi mở) đến lúc player submit

---

## 11. Sơ đồ flow tổng thể

```
PLAYER                           ADMIN                        STAGE DISPLAY
──────                           ─────                        ─────────────

/join
 └─ Nhập mã phòng
 └─ Nhập tên đội
 └─ POST /rooms/{code}/join ─────────────────────────────────────────────►
 └─ Nhận token
 └─ /player/waiting
    └─ Subscribe WebSocket
    └─ Chờ game.started          /admin/game-control/:gameId
                                  └─ [Bắt đầu game]
 ◄────────────────────── Broadcast .game.started ────────────────────────►
 └─ Navigate /player/game                                    /stage/question

                                  └─ [Mở câu hỏi]
 ◄────────────────────── Broadcast .question.started ────────────────────►
 └─ Hiện câu hỏi                                             Hiện câu hỏi
 └─ Chọn đáp án                   Theo dõi submissions
 └─ POST /games/submit ─────────────────────────────────────────────────►
 └─ Nhận is_correct                Sidebar cập nhật real-time
 └─ Hiện feedback

                                  └─ [Đóng câu hỏi]
 ◄────────────────────── Broadcast .question.closed ─────────────────────►
 └─ Hiện breakdown đáp án                                    Highlight đúng/sai

                       (lặp cho hết câu của vòng)

                                  └─ [Kết thúc vòng]
 ◄────────────────────── Broadcast .round.finished ──────────────────────►
 └─ Hiện tóm tắt vòng                                        Round complete popup

                       (lặp cho hết vòng)

                                  └─ [Kết thúc game]
 ◄────────────────────── Broadcast .game.finished ───────────────────────►
 └─ Màn hình kết quả                                         /stage/final
                                                             Confetti + Leaderboard
```

---

## 12. Các quyết định kiến trúc quan trọng

| Quyết định | Lý do |
|---|---|
| Sanctum cho cả admin lẫn player | Đơn giản, không cần OAuth |
| Zustand thay Redux | Ít boilerplate hơn, đủ cho quy mô này |
| Không persist `gameStore` | Tránh stale state khi player vào game mới |
| WebSocket-first, không polling | Latency thấp, UX mượt hơn |
| Server tính điểm | Không thể gian lận từ client |
| Stage routes không cần auth | Dùng cho máy chiếu/TV công khai |
| LocalStorage chỉ để feedback UI | Không dùng cho scoring |
| UNIQUE constraint trên submissions | Tránh double-submit ở DB level |
| `response_time_ms` từ `opened_at` | Admin kiểm soát thời điểm mở câu |

---

*Báo cáo được tạo tự động bằng phân tích toàn bộ source code — 2026-06-02*
