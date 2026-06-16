# Quiz Stack — Backend

Laravel 12 backend cho hệ thống thi quiz real-time. Cung cấp REST API và WebSocket broadcasting qua Laravel Reverb.

## Yêu cầu

- PHP 8.2+
- Composer
- MySQL 8.0
- Redis
- Docker (khuyến nghị)

## Setup

### Với Docker (từ root project)

```bash
# Từ thư mục gốc quiz-2026/
make setup   # Lần đầu: build + migrate + seed
make up      # Các lần sau
```

### Không Docker

```bash
cd quiz-be
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve          # http://localhost:8000
php artisan queue:listen --tries=1
```

## Cấu hình môi trường (`.env`)

| Biến | Mô tả | Giá trị mặc định |
|---|---|---|
| `DB_CONNECTION` | Driver database | `mysql` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` (Docker: `3307` ngoài) |
| `DB_DATABASE` | Tên database | `quiz` |
| `DB_USERNAME` | MySQL user | `quiz_user` |
| `DB_PASSWORD` | MySQL password | `THK@admin123` |
| `BROADCAST_CONNECTION` | WebSocket driver | `reverb` |
| `QUEUE_CONNECTION` | Queue driver | `database` |
| `SESSION_DRIVER` | Session driver | `database` |
| `REVERB_APP_KEY` | Reverb app key | — |
| `REVERB_PORT` | Reverb port | `8080` |

## API Routes

### Auth (Public)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/admin/login` | Admin đăng nhập, trả về Sanctum token |

### Admin (yêu cầu Bearer token)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/admin/logout` | Xoá token hiện tại |
| `GET` | `/api/admin/questions` | Danh sách câu hỏi (20/trang) |
| `POST` | `/api/admin/questions` | Tạo câu hỏi mới |
| `DELETE` | `/api/admin/questions/{id}` | Xoá câu hỏi |
| `POST` | `/api/admin/questions/import` | Import hàng loạt từ CSV hoặc XLSX |

### API Response Shape

Tất cả endpoints đều trả về cùng một cấu trúc:

```json
{
  "success": true,
  "code": 200,
  "message": "...",
  "data": { ... }
}
```

### Import CSV/XLSX

File CSV cần có các cột theo thứ tự:

```
question, total_time, A, B, C, D, correct_answer
```

- `total_time`: số giây (integer)
- `correct_answer`: giá trị `A`, `B`, `C`, hoặc `D`
- Giới hạn: **500 dòng/lần import**
- XLSX được parse native (không cần thư viện ngoài)

## Cấu trúc thư mục

```
quiz-be/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   └── QuestionController.php
│   │   └── Requests/
│   ├── Models/
│   │   ├── Admin.php
│   │   ├── Question.php
│   │   └── ...
│   ├── Services/
│   │   ├── QuestionService.php
│   │   └── QuestionImportService.php
│   ├── Repositories/
│   └── Traits/
│       └── ApiResponseTrait.php
├── database/
│   ├── migrations/
│   └── seeders/
│       └── AdminSeeder.php    # admin@quiz.com / password
├── routes/
│   └── api.php
├── docker-compose.local.yml
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

## Database Schema

```
admins           → admin accounts
games            → game sessions
teams            → teams linked to a game
rounds           → UNIQUE(game_id, round_number)
questions        → question bank
answers          → answer options (A/B/C/D) per question
round_questions  → UNIQUE(round_id, question_id), UNIQUE(round_id, order_number)
submissions      → UNIQUE(team_id, round_question_id)  ← chống duplicate submit
round_results    → kết quả mỗi đội mỗi vòng
game_results     → kết quả tổng mỗi đội
```

## Architecture Pattern

```
routes/api.php
  └─ Controller
       └─ Service
            └─ Repository
                 └─ Eloquent Model
```

- `ApiResponseTrait`: chuẩn hoá response JSON cho tất cả controllers
- `Form Requests`: validate + authorize mỗi endpoint
- `CreateQuestionRequest`: `afterValidator` đảm bảo đúng 1 đáp án đúng
- Submissions chạy trong `DB::transaction()` để đảm bảo tính nhất quán

## Chạy Tests

```bash
cd quiz-be
php artisan test                         # Toàn bộ
php artisan test tests/Feature           # Feature tests
php artisan test tests/Unit              # Unit tests
php artisan test --filter MethodName     # Test cụ thể
./vendor/bin/phpunit                     # PHPUnit trực tiếp
```

Tests chạy với in-memory drivers (không cần database thật).

## Code Style

```bash
./vendor/bin/pint   # Format theo PSR-12 (Laravel Pint)
```

## Docker Services (local)

| Container | Image | Port ngoài |
|---|---|---|
| `quiz-be-local` | PHP 8.3-fpm + nginx + supervisor | 8000 (HTTP), 8080 (Reverb) |
| `quiz-mysql-local` | mysql:8.0 | 3307 |
| `quiz-redis-local` | redis:alpine | 6379 |
