# Plan: Phase 2 — Question Type Mở Rộng (Image Input)

> **Status: IMPLEMENTED** — branch `dev_phase2`

## Mục tiêu

Thêm dạng câu hỏi **"nhìn hình đoán câu thành ngữ"** (`image_input`):
- Admin upload ảnh + nhập đáp án đúng khi tạo câu hỏi.
- Màn Stage hiển thị ảnh toàn màn hình thay cho text + options.
- Màn Player hiển thị ảnh + text input để nhập câu trả lời.
- Backend so khớp text sau khi normalize (bỏ dấu + lowercase + trim).
- Player được thử lại sau 3s nếu sai; chỉ được thử lại cho đến khi đúng hoặc câu đóng.

---

## Quyết định thiết kế

### Tại sao `type` là VARCHAR, không phải ENUM

ENUM yêu cầu `ALTER TABLE` mỗi khi thêm type mới (chậm trên bảng lớn, cần migration).
`VARCHAR(50)` → validate ở tầng application. Thêm type mới = thêm code, không đụng DB.

### Normalize text

- **FE** strip dấu tiếng Việt + lowercase + trim trước khi gửi lên BE.
- **BE** normalize `answers.content` (đáp án đúng) lúc so khớp — không lưu normalized vào DB.
- `answers.content` giữ nguyên bản gốc (đầy đủ dấu, viết hoa) để hiển thị đẹp trên Stage.

### Retry logic

- `single_choice`: không retry, throw 409 nếu đã có submission.
- `image_input`: UPDATE submission cũ nếu trả lời sai → thử lại được.
  Block retry nếu `is_correct = true` (đã đúng).
  FE cooldown 3s sau mỗi lần sai trước khi cho submit lại.

### `submitted_data` JSON trên submissions

Type-agnostic — stores player answer theo format riêng mỗi type:
- `single_choice`: `{"answer_id": 5}`
- `image_input`:   `{"text": "dau do bim leo"}`

`is_correct` boolean vẫn luôn được compute + lưu → scoring/leaderboard không thay đổi.

---

## Database Changes

### `questions` table

```sql
type        VARCHAR(50) NOT NULL DEFAULT 'single_choice'  -- đổi từ ENUM
image_path  VARCHAR     NULLABLE                           -- path trong storage/app/public
```

### `submissions` table

```sql
answer_id       BIGINT   NULLABLE  -- NULL với image_input
submitted_data  JSON     NULLABLE  -- {"answer_id":5} hoặc {"text":"dau do bim leo"}
```

---

## Backend

### Migrations

- `2026_06_03_..._alter_questions_add_image_input_support` — ENUM→VARCHAR, thêm `image_path`
- `2026_06_03_..._alter_submissions_support_text_answer` — `answer_id` nullable, thêm `submitted_data`

### QuestionType Strategy pattern

```
app/QuestionTypes/
  QuestionTypeStrategyInterface.php   — interface evaluate(submittedData, question): bool
  SingleChoiceStrategy.php            — so khớp answer_id với answers table
  ImageInputStrategy.php              — normalize + so khớp text
  QuestionTypeResolver.php            — map type string → strategy class
```

Thêm type mới = thêm 1 class + đăng ký trong Resolver, không sửa GameService.

### Files đã sửa

| File | Thay đổi |
|---|---|
| `Question` model | thêm `image_path` vào `$fillable` |
| `Submission` model | thêm `submitted_data` vào `$fillable`, cast JSON |
| `CreateQuestionRequest` | conditional validation theo type |
| `QuestionService` | `create()` phân nhánh, `formatQuestion()` thêm `type`/`imageUrl`/`answerText`, `delete()` xoá file |
| `SubmitAnswerRequest` | `answer_id` nullable, thêm `text_answer` |
| `GameService::submitAnswer()` | dùng Strategy, UPDATE on retry cho image_input |
| `GameService::buildState()` | thêm `type`/`image_url` vào question payload, ẩn answers cho image_input khi chưa closed |
| `GameController` | extract `buildQuestionData()` helper, build `answerPayload` từ request |
| `QuestionStarted` / `QuestionClosed` events | broadcast thêm `type` + `image_url` (qua `buildQuestionData`) |

### Image storage

Files lưu tại `storage/app/public/question-images/`.
Serve qua symlink: `php artisan storage:link` → `/public/storage/question-images/...`.

---

## Frontend

### Files đã sửa

| File | Thay đổi |
|---|---|
| `type/question.ts` | thêm `QuestionType`, `imageUrl`, `answerText` vào `Question` |
| `type/game.ts` | `CurrentQuestion` thêm `type`/`image_url`, `MySubmission` thêm `submitted_data` |
| `services/gameService.ts` | `submitAnswer` nhận object payload (`answer_id` hoặc `text_answer`) |
| `AdminQuestion.tsx` | type selector tabs, image upload + preview, image question list item |
| `PlayerGame.tsx` | phân nhánh `ImageInputQuestion` vs `SingleChoiceQuestion`, retry countdown 3s, `ClosedScreen` theo type |
| `StageGame.tsx` | phân nhánh `StageImageInputQuestion` vs `StageChoiceQuestion`, reveal answer sau closed |

### Normalize text (FE — mirrors BE)

```ts
function normalizeText(text: string): string {
  // strip Vietnamese diacritics + lowercase + trim + collapse spaces
}
```

FE normalize trước khi gửi `text_answer` lên BE → BE compare với normalize của `answers.content`.

---

## Luồng hoạt động

### Admin tạo câu hỏi image_input

1. Chọn tab "Nhìn hình đoán thành ngữ"
2. Upload ảnh (preview hiện ngay)
3. Nhập đáp án đúng (bản gốc đầy đủ dấu, để hiển thị trên Stage)
4. Submit qua `multipart/form-data`
5. BE lưu ảnh vào `storage/app/public/question-images/`, tạo 1 Answer record

### Gameplay — màn Player

```
question.type === 'image_input':
  → Hiện ảnh + text input
  → Submit: FE normalize → gửi text_answer lên BE
  → Đúng: show "Chính xác 🎉", không nhập thêm
  → Sai:  show "Sai rồi! Thử lại sau 3s" (countdown)
         sau 3s: show "Chưa đúng — hãy thử lại!", mở lại input
  → Câu đóng: ClosedScreen hiện ảnh + đáp án đúng

question.type === 'single_choice':
  → Giữ nguyên flow cũ (chọn option, submit 1 lần)
```

### Gameplay — màn Stage

```
question.type === 'image_input':
  → open:   Hiện ảnh lớn + "Đang chờ player trả lời..."
  → closed: Hiện ảnh + reveal đáp án đúng bên dưới (animation fade-in)

question.type === 'single_choice':
  → Giữ nguyên flow cũ (text lớn + grid 4 options)
```
