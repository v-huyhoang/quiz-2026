# Quiz Stack 2026 — Project Status Report

> **Cập nhật lần cuối:** 2026-05-26  
> **Môi trường:** Laravel 12 (BE) + React 19 + Vite (FE)  
> **Branch hiện tại:** `develop`

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
| Player Flow (FE) | ✅ Xong | 95% |
| Admin Control Panel (FE) | ✅ Xong | 95% |
| Stage Display Screens (FE) | 🟡 Một phần | 60% |
| Ranking / Leaderboard | 🟡 Một phần | 70% |
| Real-time (WebSocket) | ❌ Chưa làm | 0% |
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

### 2.7 Admin Control Panel (Frontend)
- [x] `AdminGameControl`: polling 2s, hiển thị trạng thái game real-time
- [x] Các nút điều khiển: Start Game → Start Round → Open Question → Close Question → Finish Round → Finish Game
- [x] Hiển thị danh sách submission của từng đội theo từng câu hỏi (team_submissions)
- [x] Hiển thị tiến độ câu hỏi: câu X / tổng Y trong vòng Z
- [x] Điều hướng từ AdminRoom → AdminGameControl theo `gameId`

### 2.8 Player Flow (Frontend)
- [x] `JoinRoom`: nhập mã phòng + tên đội, gọi API join, lưu token vào authStore
- [x] `PlayerWaiting`: polling game state, hiển thị danh sách đội trong lobby, tự redirect khi game bắt đầu
- [x] `PlayerGame`: polling câu hỏi, chọn đáp án, nộp bài, hiển thị kết quả khi câu đóng
- [x] Chống submit trùng: dùng `useRef` để track `round_question_id` đã nộp, xử lý 409 như success

### 2.9 Stage Display Screens (Frontend)
- [x] `StageWaitting`: hiển thị lobby + danh sách đội, auto-navigate khi câu hỏi mở
- [x] `StageGame` (tức StageQuestion): hiển thị câu hỏi lớn, countdown timer, reveal đáp án khi đóng
- [x] `StageLeaderBoard`: gọi API leaderboard thật, hiển thị bảng xếp hạng

### 2.10 Resolve Merge Conflicts
- [x] Giải quyết toàn bộ conflict giữa branch `develop` (socket-based) và stash (polling-based)
- [x] Thống nhất kiến trúc polling thay thế WebSocket
- [x] Fix TypeScript import type errors (`verbatimModuleSyntax: true`)
- [x] Exclude `src/sockets/` khỏi tsconfig (orphaned socket code)
- [x] Frontend production build pass clean

---

## 3. Tiến độ theo tính năng lớn

```
Question Management    ██████████  100%  ✅
Room Creation          ██████████  100%  ✅
Player Join            ██████████  100%  ✅
Game Flow (BE)         ██████████  100%  ✅
Admin Control (FE)     █████████░   95%  ✅
Player Flow (FE)       █████████░   95%  ✅
Stage Screens (FE)     ██████░░░░   60%  🟡
Leaderboard            ███████░░░   70%  🟡
Auto-close Timer       ░░░░░░░░░░    0%  ❌
Real-time (Reverb)     ░░░░░░░░░░    0%  ❌
Statistics             ░░░░░░░░░░    0%  ❌
```

---

## 4. Tasks dự kiến trong tương lai

### Bảng tổng hợp theo độ ưu tiên

| # | Task | Module | Độ ưu tiên | Ước tính | Phụ thuộc | Ghi chú |
|---|------|--------|------------|----------|-----------|---------|
| **F1** | Kết nối `StageFinal` với API leaderboard thật | FE / Stage | 🔴 Cao | 0.5 ngày | Leaderboard API (đã có) | Hiện dùng mock data cứng |
| **F2** | Kết nối `StageRoundComplete` với API thật | FE / Stage | 🔴 Cao | 1 ngày | Leaderboard API (đã có) | Hiện dùng mock data cứng |
| **F3** | Navigation sau khi round kết thúc cho Player | FE / Player | 🔴 Cao | 0.5 ngày | — | PlayerGame không redirect khi round/game kết thúc |
| **F4** | Navigation từ StageLeaderBoard sang màn tiếp theo | FE / Stage | 🔴 Cao | 0.5 ngày | — | Sau leaderboard cần đi về waiting hoặc final |
| **F5** | Auto-close câu hỏi khi hết giờ (BE) | BE / GameService | 🔴 Cao | 1 ngày | Laravel Queue | Hiện admin phải close thủ công |
| **F6** | Hiển thị per-round leaderboard (sau mỗi vòng) | BE + FE | 🔴 Cao | 1.5 ngày | Round finish flow | Cần API + UI riêng cho leaderboard từng vòng |
| **F7** | Admin logout thật sự (server-side) | FE / Navbar | 🟡 Trung bình | 0.5 ngày | — | Hiện chỉ clear localStorage, chưa gọi API |
| **F8** | Question edit (update API + UI) | BE + FE | 🟡 Trung bình | 1 ngày | — | `QuestionController.update()` hiện là stub rỗng |
| **F9** | Question show detail (GET /questions/{id}) | BE | 🟡 Trung bình | 0.5 ngày | — | `QuestionController.show()` hiện là stub rỗng |
| **F10** | Validate round_questions khi tạo phòng mode manual | BE | 🟡 Trung bình | 0.5 ngày | — | Chưa validate đủ số câu hỏi per round |
| **F11** | Tie-breaking: ưu tiên câu trả lời sớm nhất ở vòng cuối | BE / Leaderboard | 🟡 Trung bình | 1 ngày | — | Game spec yêu cầu nhưng chưa implement |
| **F12** | Admin Dashboard với số liệu tổng quan | FE / Admin | 🟡 Trung bình | 1.5 ngày | Statistics API | `AdminDashboard.tsx` hiện là placeholder |
| **F13** | Export kết quả game ra CSV | BE + FE | 🟡 Trung bình | 1 ngày | Leaderboard API | Button Export CSV đã có trong StageFinal (chưa nối) |
| **F14** | API per-round leaderboard | BE | 🟡 Trung bình | 0.5 ngày | — | `GET /games/{id}/rounds/{round}/leaderboard` |
| **F15** | API thống kê game (submissions, tỷ lệ đúng) | BE | 🟡 Trung bình | 1 ngày | — | `GET /admin/games/{id}/statistics` |
| **F16** | Room update API (đổi tên, cập nhật status) | BE | 🟡 Trung bình | 0.5 ngày | — | `RoomController.update()` có nhưng FE chưa dùng |
| **F17** | Hiển thị thời gian phản hồi per-câu trong AdminControl | FE / Admin | 🟡 Trung bình | 0.5 ngày | team_submissions API (đã có) | response_time_ms đã có trong submissions |
| **F18** | Laravel Reverb — replace polling bằng WebSocket | BE + FE | 🟢 Thấp | 3 ngày | — | Giảm latency từ 2s → realtime, ưu tiên sau khi tính năng ổn định |
| **F19** | Phân quyền nhiều Admin (multi-admin) | BE | 🟢 Thấp | 1.5 ngày | — | Hiện chỉ có 1 admin seeded |
| **F20** | Rate limiting cho answer submission | BE | 🟢 Thấp | 0.5 ngày | — | Tránh spam API |
| **F21** | Câu hỏi theo categories/tags | BE + FE | 🟢 Thấp | 2 ngày | — | Schema chưa có, cần migration |
| **F22** | Preview câu hỏi trước khi import | FE | 🟢 Thấp | 1 ngày | — | Hiện import thẳng không xem trước |
| **F23** | Reset game về trạng thái pending | BE + FE | 🟢 Thấp | 0.5 ngày | — | `POST /admin/games/{id}/reset` |
| **F24** | Trang lịch sử các game đã chơi | BE + FE | 🟢 Thấp | 2 ngày | — | Cần query game đã finished |
| **F25** | Mobile responsive cho Player screens | FE | 🟢 Thấp | 1 ngày | — | Cơ bản ổn nhưng chưa test kỹ trên mobile |

### Chi tiết nhóm ưu tiên cao (phải làm trước)

#### F1 — StageFinal kết nối API thật
**Vấn đề:** `StageFinal.tsx` dùng `OVERALL_CHAMPION` và `FULL_LEADERBOARD` là mock data cứng.  
**Giải pháp:** Gọi `getLeaderboard(gameId)` từ `gameService.ts`, lấy `gameId` từ `useSearchParams`.  
**Kết quả mong đợi:** Champion = `data[0]`, Full standings = toàn bộ `data` array.

#### F2 — StageRoundComplete kết nối API thật
**Vấn đề:** `StageRoundComplete.tsx` dùng mock `ROUND_STATS`, `TOP_TEAMS`. Nút điều hướng có chữ `[MOCK]`.  
**Giải pháp:** Cần thêm API `GET /games/{id}/rounds/{round}/leaderboard` (task F14), sau đó nối FE.

#### F3 — PlayerGame navigation khi round/game kết thúc
**Vấn đề:** Khi game status = `finished` hoặc round status = `finished`, PlayerGame không tự navigate.  
**Giải pháp:** Trong polling loop của PlayerGame, check `state.status === "finished"` → navigate về `/join`; check `!state.current_round` → hiện màn "Chờ vòng tiếp theo".

#### F4 — StageLeaderBoard navigation
**Vấn đề:** `StageLeaderBoard.tsx` không có nút/logic để chuyển sang màn tiếp theo.  
**Giải pháp:** Polling game state trong StageLeaderBoard; nếu game `finished` → `/stage/final`; nếu có round mới `pending` → `/stage/waiting`.

#### F5 — Auto-close câu hỏi khi hết giờ
**Vấn đề:** Timer đếm ngược ở FE nhưng backend không tự đóng câu hỏi. Admin phải bấm Close thủ công.  
**Giải pháp:** Dispatch Laravel Job khi `openNextQuestion()` với `delay = time_limit_seconds`. Job gọi `closeCurrentQuestion()`. Cần `QUEUE_CONNECTION=database` và `php artisan queue:work`.

---

## 5. Known Issues / Technical Debt

| # | Vấn đề | Mức độ | Ghi chú |
|---|--------|--------|---------|
| T1 | `src/sockets/` — orphaned socket code từ branch merge | Thấp | Đã exclude khỏi tsconfig, không ảnh hưởng build |
| T2 | `RoomController.index()` trả về paginated nhưng FE dùng flat array qua `GameController.index()` | Thấp | Workaround đang hoạt động, cần refactor |
| T3 | `getQuestions()` trong FE trả về paginated data, AdminRoom gọi `data.map()` trực tiếp | Trung bình | Có thể gây bug nếu > 20 câu hỏi (trang đầu tiên thôi) |
| T4 | Migration `2026_05_25_000001` và `2026_05_25_000002` chưa chạy (untracked) | Cao | Cần kiểm tra và `php artisan migrate` |
| T5 | `round_results` và `game_results` table — schema có nhưng không dùng | Thấp | Có thể dùng sau cho statistics |
| T6 | Polling 2s — tốn bandwidth, độ trễ tối đa 2s | Thấp | Sẽ replace bằng Reverb khi ổn định (F18) |

---

## 6. Môi trường và Setup

```bash
# Backend
cd quiz-be
docker compose -f docker-compose.local.yml up -d
php artisan migrate --seed   # admin@quiz.com / password

# Frontend
cd quiz-fe
cp .env.example .env         # set VITE_API_BASE_URL=http://localhost:8000/api
npm install && npm run dev

# Build check
npm run build   # ✅ passes clean as of 2026-05-26
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
