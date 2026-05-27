# Quiz Stack 2026 — Project Status Report

> **Cập nhật lần cuối:** 2026-05-27  
> **Môi trường:** Laravel 12 (BE) + React 19 + Vite (FE)  
> **Branch hiện tại:** `feat/player_join_room`

---

## 1. Tổng quan tiến độ

| Hạng mục | Trạng thái | Hoàn thành |
|---|---|---|
| Infrastructure & DevOps | ✅ Xong | 100% |
| Database Schema | ✅ Xong | 100% |
| Authentication | ✅ Xong | 100% |
| Question Management (BE + FE) | ✅ Xong | 100% |
| Room / Game Creation | ✅ Xong | 100% |
| Game Flow API (BE) | ✅ Xong | 100% |
| Real-time (WebSocket / Reverb) | 🟡 Một phần | 75% |
| Player Flow (FE) | ✅ Xong | 95% |
| Admin Control Panel (FE) | ✅ Xong | 95% |
| Stage Display Screens (FE) | 🟡 Một phần | 70% |
| Ranking / Leaderboard | 🟡 Một phần | 70% |
| Statistics & Reporting | ❌ Chưa làm | 0% |

---

## 2. Các task đã hoàn thành

### 2.1 Infrastructure & DevOps
- [x] Khởi tạo monorepo `quiz-be/` (Laravel 12) + `quiz-fe/` (React 19 + Vite + TypeScript)
- [x] Docker Compose cho môi trường local: app `:8000`, Reverb `:8080`, MySQL `:3307`
- [x] Makefile với các lệnh tiện ích cho cả BE và FE
- [x] Cấu hình ESLint, Pint (PSR-12), tsconfig strict mode

### 2.2 Database & Schema
- [x] Migration: `admins`, `games`, `teams`, `rounds`, `questions`, `answers`
- [x] Migration: `round_questions` (pivot với status machine: pending → open → closed)
- [x] Migration: `submissions` (unique constraint `team_id + round_question_id`)
- [x] Migration: `round_results`, `game_results` (bảng tổng kết — schema đã có, chưa dùng)
- [x] Thêm cột `access_code`, `rounds`, `questions_per_round`, `question_mode` vào `games`
- [x] Seeder: Admin, Game, Round, Question, Team mẫu

### 2.3 Authentication
- [x] Admin login/logout bằng Laravel Sanctum (`admin-token` ability)
- [x] Team (player) token khi join room (`player-token` ability)
- [x] Route guards phía FE: `AdminGuard`, `PlayerGuard`
- [x] `useAuthStore` (Zustand + persist) lưu `token`, `teamId`, `teamName`, `gameId`, `role`
- [x] Axios interceptor tự gắn `Authorization: Bearer` + redirect 401

### 2.4 Question Management
- [x] CRUD câu hỏi qua `QuestionController` + `QuestionService`
- [x] Import hàng loạt từ file CSV và XLSX (không dùng thư viện ngoài, parse thủ công bằng `ZipArchive` + `SimpleXMLElement`, giới hạn 500 dòng)
- [x] Form Request `CreateQuestionRequest` với afterValidator: bắt buộc đúng 1 đáp án đúng
- [x] UI Admin quản lý câu hỏi: tạo mới, xóa, import file, phân trang

### 2.5 Room / Game Creation
- [x] `RoomController` + `RoomService`: tạo phòng, xóa phòng
- [x] Tạo phòng: chọn tên, số vòng, số câu/vòng, mã phòng, chế độ câu hỏi (random/manual)
- [x] Chế độ manual: admin chọn tay câu hỏi cho từng vòng khi tạo phòng
- [x] Chế độ random: hệ thống tự chọn ngẫu nhiên khi bắt đầu vòng
- [x] UI AdminRoom: danh sách phòng, tạo phòng (3 bước wizard), sinh QR code, xóa phòng
- [x] QR code trỏ đến URL join cho người chơi

### 2.6 Game Flow API (Backend hoàn chỉnh)
- [x] `POST /rooms/{code}/join` — player join phòng, nhận token + team_id
- [x] `GET /games/{id}/state` — trạng thái game public (ẩn đáp án đúng khi câu hỏi đang mở)
- [x] `GET /admin/games/{id}/state` — trạng thái game đầy đủ cho admin (có `team_submissions`)
- [x] `POST /admin/games/{id}/start` — admin bắt đầu game
- [x] `POST /admin/games/{id}/start-round` — admin bắt đầu vòng tiếp theo
- [x] `POST /admin/games/{id}/open-question` — admin mở câu hỏi kế tiếp
- [x] `POST /admin/games/{id}/close-question` — admin đóng câu hỏi đang mở
- [x] `POST /admin/games/{id}/finish-round` — admin kết thúc vòng hiện tại
- [x] `POST /admin/games/{id}/finish` — admin kết thúc game
- [x] `POST /games/submit` — player nộp câu trả lời (auth:sanctum, idempotent với 409)
- [x] `GET /games/{id}/leaderboard` — bảng xếp hạng tổng kết

### 2.7 Real-time (WebSocket / Reverb)
- [x] Cấu hình Laravel Reverb (port 8080) + Laravel Echo (pusher-js) phía FE
- [x] `src/sockets/echo.ts`: khởi tạo Echo instance, export `getGameChannel(id)`
- [x] BE broadcast events: `TeamJoined`, `GameStarted`, `QuestionStarted`, `QuestionClosed`, `RoundFinished`, `GameFinished`
- [x] Tất cả events dùng `ShouldBroadcastNow` (synchronous) — không cần queue
- [x] `PlayerWaiting`: subscribe `.team.joined` + `.game.started`, auto-navigate khi game bắt đầu
- [x] `PlayerGame`: subscribe `.question.started`, `.question.closed`, `.game.finished`; reveal đáp án, navigate khi game kết thúc
- [x] `StageWaitting`: subscribe `.team.joined`, `.question.started`, `.game.finished`
- [x] `StageGame`: subscribe `.question.started`, `.question.closed`, `.round.finished`, `.game.finished`; navigate tự động theo event
- [x] Cleanup channel (`echo.leave`) khi component unmount

### 2.8 Admin Control Panel (Frontend)
- [x] `AdminGameControl`: polling 2s, hiển thị trạng thái game real-time
- [x] Các nút điều khiển: Start Game → Start Round → Open Question → Close Question → Finish Round → Finish Game
- [x] Hiển thị danh sách submission của từng đội theo từng câu hỏi (team_submissions)
- [x] Hiển thị tiến độ câu hỏi: câu X / tổng Y trong vòng Z
- [x] Điều hướng từ AdminRoom → AdminGameControl theo `gameId`

### 2.9 Player Flow (Frontend)
- [x] `JoinRoom`: nhập mã phòng + tên đội, gọi API join, lưu token vào authStore
- [x] `PlayerWaiting`: nhận initial state qua API, sau đó dùng WS; hiển thị lobby, auto-navigate khi `.game.started`
- [x] `PlayerGame`: nhận initial state qua API, sau đó WS-driven; chọn đáp án, nộp bài, reveal khi `.question.closed`, navigate khi `.game.finished`
- [x] Chống submit trùng: dùng `useRef` để track `round_question_id` đã nộp, xử lý 409 như success

### 2.10 Stage Display Screens (Frontend — một phần)
- [x] `StageWaitting`: WS-driven; hiển thị lobby + danh sách đội, auto-navigate khi `.question.started`
- [x] `StageGame`: hoàn toàn WS-driven; countdown timer, reveal đáp án khi `.question.closed`, navigate khi `.round.finished` hoặc `.game.finished`
- [x] `StageLeaderBoard`: gọi API leaderboard thật, hiển thị bảng xếp hạng toàn game
- [ ] `StageRoundComplete`: UI có nhưng dùng mock data cứng; **không được route đến** (luồng hiện tại bỏ qua màn này)
- [ ] `StageFinal`: animation và layout xong nhưng **dữ liệu vẫn là mock** — chưa gọi API leaderboard thật

### 2.11 Resolve Merge Conflicts & Refactor
- [x] Giải quyết toàn bộ conflict giữa branch `develop` (socket-based) và stash (polling-based)
- [x] Thống nhất kiến trúc: WebSocket cho player/stage screens, polling cho admin control
- [x] Fix TypeScript import type errors (`verbatimModuleSyntax: true`)
- [x] Exclude `src/sockets/` khỏi tsconfig (orphaned legacy hook code, không ảnh hưởng build)
- [x] Frontend production build pass clean

---

## 3. Tiến độ theo tính năng lớn

```
Question Management    ██████████  100%  ✅
Room Creation          ██████████  100%  ✅
Player Join            ██████████  100%  ✅
Game Flow (BE)         ██████████  100%  ✅
WebSocket (Reverb)     ███████░░░   75%  🟡  (admin còn polling)
Admin Control (FE)     █████████░   95%  ✅
Player Flow (FE)       █████████░   95%  ✅
Stage Screens (FE)     ███████░░░   70%  🟡  (StageFinal + StageRoundComplete còn mock)
Leaderboard            ███████░░░   70%  🟡  (per-round chưa có)
Auto-close Timer       ░░░░░░░░░░    0%  ❌
Statistics             ░░░░░░░░░░    0%  ❌
```

---

## 4. Tasks dự kiến trong tương lai

### Bảng tổng hợp theo độ ưu tiên

| # | Task | Module | Độ ưu tiên | Ước tính | Phụ thuộc | Ghi chú |
|---|------|--------|------------|----------|-----------|---------|
| **F1** | Kết nối `StageFinal` với API leaderboard thật | FE / Stage | 🔴 Cao | 0.5 ngày | Leaderboard API (đã có) | Dùng `getLeaderboard(gameId)`, lấy gameId từ searchParams |
| **F2** | Kết nối `StageRoundComplete` với API thật | FE / Stage | 🔴 Cao | 1 ngày | F14 (per-round leaderboard API) | Cần F14 xong trước; hiện màn này không được route đến |
| **F5** | Auto-close câu hỏi khi hết giờ (BE) | BE / GameService | 🔴 Cao | 1 ngày | Laravel Queue (`QUEUE_CONNECTION=database`) | Cần `AutoCloseQuestionJob` dispatch với delay |
| **F6** | Hiển thị per-round leaderboard sau mỗi vòng | BE + FE | 🔴 Cao | 1.5 ngày | F14 | Cần API + route `StageRoundComplete` vào luồng |
| **F14** | API per-round leaderboard | BE | 🔴 Cao | 0.5 ngày | — | `GET /games/{id}/rounds/{round}/leaderboard`; F2 và F6 phụ thuộc task này |
| **F7** | Admin logout thật sự (server-side) | FE / Navbar | 🟡 Trung bình | 0.5 ngày | — | Hiện chỉ clear localStorage, chưa gọi `POST /admin/logout` |
| **F8** | Question edit (update API + UI) | BE + FE | 🟡 Trung bình | 1 ngày | — | `QuestionController.update()` hiện là stub rỗng |
| **F9** | Question show detail (`GET /questions/{id}`) | BE | 🟡 Trung bình | 0.5 ngày | — | `QuestionController.show()` hiện là stub rỗng |
| **F10** | Validate round_questions khi tạo phòng mode manual | BE | 🟡 Trung bình | 0.5 ngày | — | Chưa validate đủ số câu hỏi per round |
| **F11** | Tie-breaking: ưu tiên câu trả lời sớm nhất ở vòng cuối | BE / Leaderboard | 🟡 Trung bình | 1 ngày | — | Game spec yêu cầu nhưng chưa implement |
| **F12** | Admin Dashboard với số liệu tổng quan | FE / Admin | 🟡 Trung bình | 1.5 ngày | F15 | `AdminDashboard.tsx` hiện là placeholder |
| **F13** | Export kết quả game ra CSV | BE + FE | 🟡 Trung bình | 1 ngày | Leaderboard API | Button Export CSV đã có trong StageFinal (chưa nối) |
| **F15** | API thống kê game (submissions, tỷ lệ đúng) | BE | 🟡 Trung bình | 1 ngày | — | `GET /admin/games/{id}/statistics` |
| **F16** | Room update API (đổi tên, cập nhật status) | BE | 🟡 Trung bình | 0.5 ngày | — | `RoomController.update()` có nhưng FE chưa dùng |
| **F17** | Hiển thị thời gian phản hồi per-câu trong AdminControl | FE / Admin | 🟡 Trung bình | 0.5 ngày | — | `response_time_ms` đã có trong submissions, chỉ cần hiển thị |
| **F18** | AdminGameControl dùng WebSocket thay polling | FE / Admin | 🟢 Thấp | 1 ngày | — | Admin cần thêm data `team_submissions` vào WS event hoặc sub channel riêng |
| **F19** | Phân quyền nhiều Admin (multi-admin) | BE | 🟢 Thấp | 1.5 ngày | — | Hiện chỉ có 1 admin seeded |
| **F20** | Rate limiting cho answer submission | BE | 🟢 Thấp | 0.5 ngày | — | Tránh spam API |
| **F21** | Câu hỏi theo categories/tags | BE + FE | 🟢 Thấp | 2 ngày | — | Schema chưa có, cần migration |
| **F22** | Preview câu hỏi trước khi import | FE | 🟢 Thấp | 1 ngày | — | Hiện import thẳng không xem trước |
| **F23** | Reset game về trạng thái pending | BE + FE | 🟢 Thấp | 0.5 ngày | — | `POST /admin/games/{id}/reset` |
| **F24** | Trang lịch sử các game đã chơi | BE + FE | 🟢 Thấp | 2 ngày | — | Cần query game đã finished |
| **F25** | Mobile responsive cho Player screens | FE | 🟢 Thấp | 1 ngày | — | Cơ bản ổn nhưng chưa test kỹ trên mobile |

### Chi tiết nhóm ưu tiên cao (phải làm trước)

#### F14 + F6 — Per-round Leaderboard (chuỗi phụ thuộc)
**Thứ tự:** F14 (BE) → F2 (FE StageRoundComplete) + F6 (FE navigation)  
**BE (F14):** Tạo endpoint `GET /games/{id}/rounds/{round}/leaderboard` — query submissions trong round đó, tính điểm/thời gian, trả về ranked list.  
**FE (F2):** Thay mock data trong `StageRoundComplete.tsx` bằng call thật. Route `StageGame` khi nhận `.round.finished` event sang `/stage/round-complete?gameId=X&round=Y` thay vì `/stage/leaderboard`.  
**FE (F6):** `StageRoundComplete` cần nút/logic để navigate: nếu còn round tiếp → `/stage/waiting`; nếu game finished → `/stage/final`.

#### F1 — StageFinal kết nối API thật
**Vấn đề:** `StageFinal.tsx` dùng `OVERALL_CHAMPION` và `FULL_LEADERBOARD` là mock data cứng.  
**Giải pháp:** Gọi `getLeaderboard(gameId)` từ `gameService.ts`, lấy `gameId` từ `useSearchParams`.  
**Kết quả mong đợi:** Champion = `data[0]`, Full standings = toàn bộ `data` array.

#### F5 — Auto-close câu hỏi khi hết giờ
**Vấn đề:** Timer đếm ngược ở FE nhưng backend không tự đóng câu hỏi. Admin phải bấm Close thủ công.  
**Giải pháp:** Trong `GameService::openNextQuestion()`, dispatch `AutoCloseQuestionJob` với delay = `time_limit_seconds`. Job gọi `closeCurrentQuestion()` và broadcast `QuestionClosed`.  
**Cần:** `QUEUE_CONNECTION=database`, migration `jobs` table, `php artisan queue:work` chạy trong container.

---

## 5. Known Issues / Technical Debt

| # | Vấn đề | Mức độ | Ghi chú |
|---|--------|--------|---------|
| T1 | `src/sockets/` — `useGameSocket.ts` và `register-game-listeners.ts` là orphaned code (hooks cũ, không được import) | Thấp | Đã exclude khỏi tsconfig; components dùng trực tiếp `getGameChannel()` + `channel.listen()` thay vì hook |
| T2 | `RoomController.index()` trả về paginated nhưng FE dùng flat array qua `GameController.index()` | Thấp | Workaround đang hoạt động, cần refactor |
| T3 | `getQuestions()` trong FE trả về paginated data, AdminRoom gọi `data.map()` trực tiếp | Trung bình | Có thể gây bug nếu > 20 câu hỏi (chỉ lấy trang đầu) |
| T4 | Migration `2026_05_25_000001` và `2026_05_25_000002` chưa chạy (untracked) | Cao | Cần kiểm tra và `php artisan migrate` |
| T5 | `round_results` và `game_results` table — schema có nhưng không dùng | Thấp | Có thể dùng sau cho statistics |
| T6 | `StageRoundComplete` có UI nhưng không được route đến trong luồng hiện tại | Trung bình | Chờ F14 xong mới wire vào |
| T7 | `StageFinal` dùng mock data — dễ gây nhầm khi demo | Cao | Fix nhanh (F1), chỉ cần 1 dòng gọi API |
| T8 | AdminGameControl dùng polling 2s trong khi các màn khác đã dùng WS | Thấp | Admin cần `team_submissions` realtime; cân nhắc thêm data vào `QuestionStarted` event |
| T9 | `gameStore.ts` được define nhưng không dùng — components quản lý state cục bộ qua `useState` | Thấp | Không gây bug nhưng tạo confusion; cân nhắc xóa hoặc dùng nhất quán |

---

## 6. Môi trường và Setup

```bash
# Backend
cd quiz-be
docker compose -f docker-compose.local.yml up -d
php artisan migrate --seed   # admin@quiz.com / password

# Frontend
cd quiz-fe
cp .env.example .env
# Set các biến:
#   VITE_API_BASE_URL=http://localhost:8000/api
#   VITE_REVERB_APP_KEY=<key>
#   VITE_REVERB_HOST=localhost
#   VITE_REVERB_PORT=8080
npm install && npm run dev

# Build check
npm run build   # ✅ passes clean as of 2026-05-27
```

---

## 7. Design Tokens

| Token | Value | Dùng cho |
|---|---|---|
| `primary` | `#006876` (teal) | Màu chủ đạo, buttons, borders |
| `primary-container` | `#00bcd4` | Màu accent sáng hơn |
| `secondary` | `#ac3509` (burnt orange) | Màu nhấn phụ, rank 1 |
| `surface` | `#f9f9f9` | Nền trang |
| Font | Montserrat | Tất cả text |
| Animation | `motion/react` v12 | Framer Motion |
