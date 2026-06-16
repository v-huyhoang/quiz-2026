# Quiz Stack 2026 — Project Status Report

> **Cập nhật lần cuối:** 2026-05-31
> **Môi trường:** Laravel 12 (BE) + React 19 + Vite (FE)
> **Branch hiện tại:** `develop`

---

## 1. Tổng quan tiến độ

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Infrastructure & DevOps | ✅ Xong | Docker, Makefile, Supervisor |
| Database Schema | ✅ Xong | Tất cả migration đã chạy |
| Authentication (Admin + Player) | ✅ Xong | Sanctum tokens |
| Question Management (BE + FE) | ✅ Xong | CRUD + bulk import CSV/XLSX |
| Room / Game Creation (BE + FE) | ✅ Xong | Admin UI wired to real API |
| Game Flow API (BE) | ✅ Xong | Full state machine |
| Real-time WebSocket (Reverb) | ✅ Xong | Tất cả events đã broadcast |
| Player Flow (FE) | ✅ Xong | Join → Waiting → Game → Result |
| Admin Control Panel (FE) | ✅ Xong | Polling + WebSocket đồng thời |
| Stage Display Screens (FE) | ✅ Xong | Wired to real events + real API |
| Ranking / Leaderboard | ✅ Xong | Correct count + response time |
| Round Results API + Display | ✅ Xong | Per-round top 20, hiển thị trên waiting + final |
| LocalStorage correct answers | ✅ Xong | Per-round key, lưu ngay sau submit |
| Admin kết quả game đã kết thúc | ✅ Xong | Modal trong AdminRoom |
| Statistics & Reporting | ❌ Chưa làm | Scope tương lai |

---

## 2. Kiến trúc tổng thể

```
quiz-be/   Laravel 12 · PHP 8.3 · MySQL 8 · Laravel Reverb (WebSocket)
quiz-fe/   React 19 · Vite · TypeScript · Zustand · laravel-echo + pusher-js
```

### Docker (local)
| Container | Port host | Vai trò |
|---|---|---|
| `quiz-be-local` | 8000→80, 8080→8080 | Nginx + PHP-FPM + Reverb + Queue |
| `quiz-mysql-local` | 3307→3306 | MySQL 8 |
| `quiz-redis-local` | 6379 | Redis (queue driver) |
| `quiz-fe-local` | 5173 | Vite dev server |

### Makefile (chạy từ project root)
```bash
make setup        # Lần đầu: build + env + composer + yarn + migrate + seed + reverb
make up           # Start tất cả containers
make down         # Stop
make be-composer  # composer install trong container
make be-services  # Start/restart Reverb + queue worker
make fe-install   # yarn install + clear Vite cache + restart FE
make migrate      # php artisan migrate
make seed         # php artisan db:seed
```

---

## 3. Database Schema

### `games`
| Column | Type | Ghi chú |
|---|---|---|
| id | PK | |
| name | string | |
| access_code | string(10), unique | Mã phòng |
| status | enum: pending/active/finished | |
| rounds | int, default 3 | |
| questions_per_round | int, default 10 | |
| question_mode | enum: random/manual | |
| started_at | timestamp, null | |
| ended_at | timestamp, null | |

### `teams`
| Column | Type | Ghi chú |
|---|---|---|
| id | PK | |
| game_id | FK → games | cascade delete |
| name | string | |
| is_present | boolean, default true | Lọc team đang chơi |
| UNIQUE | (game_id, name) | |

### `rounds`
| Column | Type | Ghi chú |
|---|---|---|
| id | PK | |
| game_id | FK → games | |
| round_number | int | |
| status | enum: pending/active/finished | |
| started_at / ended_at | timestamp, null | |
| UNIQUE | (game_id, round_number) | |

### `questions`
| Column | Type | |
|---|---|---|
| id | PK | |
| content | string | |
| type | string | |
| time_limit_seconds | int | |

### `answers`
| Column | Type | |
|---|---|---|
| id | PK | |
| question_id | FK → questions | cascade delete |
| content | string | |
| is_correct | boolean | |

### `round_questions`
| Column | Type | Ghi chú |
|---|---|---|
| id | PK | |
| round_id | FK → rounds | cascade delete |
| question_id | FK → questions | |
| order_number | int | |
| status | enum: pending/open/closed | |
| opened_at / closed_at | timestamp, null | |
| UNIQUE | (round_id, order_number) | |
| UNIQUE | (round_id, question_id) | |

### `submissions`
| Column | Type | Ghi chú |
|---|---|---|
| id | PK | |
| round_question_id | FK → round_questions | cascade delete |
| team_id | FK → teams | |
| answer_id | FK → answers | |
| is_correct | boolean | |
| response_time_ms | int | ms từ client (fallback: tính từ opened_at nếu client không gửi) |
| UNIQUE | (team_id, round_question_id) | Chống duplicate |

### `admins`
| Column | Type | |
|---|---|---|
| id | PK | email, password, name |

---

## 4. Luồng hoạt động chi tiết

### Luồng 1 — Admin Login
1. POST `/admin/login` → trả về `token`
2. FE lưu vào `authStore` (persist localStorage key `quiz-auth`)
3. Redirect → `/admin/rooms`

### Luồng 2 — Admin tạo Room
1. Admin điền form (tên, rounds, questions_per_round, access_code, question_mode)
2. POST `/admin/rooms` → BE tạo `games` + `rounds` + `round_questions` (random hoặc manual)
3. FE hiển thị access_code + QR code cho player quét

### Luồng 3 — Player Join Room
1. POST `/rooms/{code}/join` + `{ team_name }`
2. BE tạo `teams` row + Sanctum token
3. BE broadcast `TeamJoined` → channel `game.{gameId}`
4. FE lưu `{ token, teamId, teamName, gameId, role: "player" }` vào `authStore`
5. FE setup authenticated Echo: `getPlayerEcho(token)`
6. Redirect → `/player/waiting`

### Luồng 4 — Waiting Room
1. FE fetch `GET /games/{id}/state`
2. Subscribe `useGameSocket(gameId)`: lắng nghe `team.joined`, `team.left`, `game.started`
3. Khi `.game.started` → redirect → `/player/game`

### Luồng 5 — Admin điều khiển game

```
startGame()         → game: pending → active       → broadcast game.started
startRound()        → round: pending → active       → mở câu hỏi đầu tiên tự động
                                                    → broadcast question.started
openQuestion()      → round_question: pending → open → broadcast question.started (có opened_at)
closeQuestion()     → round_question: open → closed  → broadcast question.closed (is_correct revealed)
finishRound()       → round: active → finished      → broadcast round.finished
[lặp lại cho vòng tiếp theo]
finishGame()        → game: active → finished       → broadcast game.finished
```

### Luồng 6 — Player trả lời câu hỏi
1. Nhận `.question.started` → lấy `opened_at` từ event, hiển thị câu hỏi + timer
2. Player chọn đáp án → tính `response_time_ms = Date.now() - new Date(opened_at).getTime()`
3. POST `/games/submit` `{ round_question_id, answer_id, response_time_ms }`
4. BE trả về `{ is_correct: bool }` ngay trong response
5. FE hiển thị "Chính xác!" hoặc "Sai rồi!" dựa vào `is_correct`
6. Nếu đúng → ghi vào `localStorage["quiz_correct_{gameId}_round_{roundNumber}"]` = `[{ round_question_id, response_time_ms }]`

### Luồng 7 — Stage Display
1. FE fetch `GET /games/{id}/state`
2. Subscribe events: `question.started`, `question.closed`, `round.finished`, `game.finished`
3. Hiển thị theo trạng thái:
   - `question.open` → câu hỏi + 4 đáp án + timer + số team đã nộp
   - `question.closed` → reveal đáp án đúng + kết quả từng team
   - `round.finished` → popup StageRoundComplete (top 3 vòng vừa xong, fetch từ `GET /games/{id}/round-results`)
   - Waiting for next round → StageWaitingForRound (fetch kết quả các vòng trước)
   - `game.finished` → redirect → `/stage/final?gameId={id}`

---

## 5. WebSocket Channels & Events

### Channels
| Channel | Auth | Subscriber |
|---|---|---|
| `game.{gameId}` | Public | Player, Stage, Admin |
| `presence-game.{gameId}` | Phải là team của game đó | Player (waiting room) |
| `stage` | Public | Stage display |
| `admin` | Admin only | Admin panel |

### Events
| Event | Channels | Trigger | Payload key |
|---|---|---|---|
| `game.started` | game.X, stage, admin | startGame() | game_id, status, rounds_total |
| `game.finished` | game.X, stage, admin | finishGame() | game_id, status |
| `question.started` | game.X, stage, admin | openQuestion() / startRound() | round_question_id, order_number, time_limit_seconds, **opened_at**, question{content, answers[is_correct: null]} |
| `question.closed` | game.X, stage, admin | closeQuestion() | round_question_id, question{answers[is_correct: true/false]} |
| `round.finished` | game.X, stage, admin | finishRound() | game_id, round_number |
| `team.joined` | game.X only | joinRoom() | game_id, team{id, name} |
| `team.left` | game.X only | leave() / Reverb webhook | game_id, team{id, name} |

> **Quan trọng:** `is_correct` = `null` khi câu hỏi đang mở, chỉ reveal sau khi `question.closed`
> **`opened_at`** trong `question.started` là server timestamp — FE dùng để tính `response_time_ms` đồng nhất với DB.

---

## 6. Frontend Architecture

### Route structure
```
/admin/login          → AdminLogin (public)
/admin/rooms          → AdminRoom (AdminGuard)
/admin/game-control/:gameId → AdminGameControl (AdminGuard)
/admin/question           → AdminQuestion (AdminGuard)
/join                     → JoinRoom (public)
/player/waiting           → PlayerWaiting (PlayerGuard)
/player/game              → PlayerGame (PlayerGuard)
/stage/waiting            → StageWaitting (no guard)
/stage/question           → StageGame (no guard)
/stage/leaderboard    → StageLeaderBoard (no guard)
/stage/round-complete → StageRoundComplete (no guard)
/stage/final          → StageFinal (no guard, query: ?gameId=)
```

### State management
| Store | Persist | Nội dung |
|---|---|---|
| `authStore` | ✅ localStorage `quiz-auth` | token, teamId, teamName, gameId, role |
| `gameStore` | ❌ memory only | gameId, currentQuestion, submittedQuestionIds, leaderboard |

### Custom hooks
| Hook | Mô tả |
|---|---|
| `useGameSocket(gameId, events)` | Subscribe channel `game.{gameId}`, auto-cleanup khi unmount |
| `usePolling(fn, intervalMs, enabled)` | Interval fetch không overlap |

### Shared components
| Component | Props |
|---|---|
| `QuestionTimer` | openedAt, limitSec, variant (player/stage/admin), urgentThreshold |
| `LoadingScreen` | message?, spinnerOnly? |
| `GridBg` | size?, opacity? |

### LocalStorage (game data)
| Key | Value | Mục đích |
|---|---|---|
| `quiz-auth` | authStore state | Persist session |
| `quiz_correct_{gameId}_round_{roundNumber}` | `[{ round_question_id, response_time_ms }]` | Backup câu đúng per-round; dùng cho màn hình GameFinished |

---

## 7. Còn lại / Roadmap

| Hạng mục | Ưu tiên | Ghi chú |
|---|---|---|
| Statistics & Reporting | Thấp | Thống kê lịch sử game |
| Admin logout real API | Thấp | Hiện chỉ clear localStorage |
| Edit question (BE+FE) | Thấp | Chỉ có create/delete hiện tại |
| Reconnect recovery dùng localStorage | Trung bình | Dùng `quiz_correct_{gameId}_round_N` khi reconnect |
| Error boundary (React) | Thấp | Prevent crash toàn app |
