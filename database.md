# Database Design — Quiz Stack

## Overview

Database được thiết kế để:

- Đảm bảo data integrity
- Chống duplicate submission
- Giải quyết concurrency
- Tracking realtime leaderboard
- Có khả năng audit sau game

---

# Tables

## teams

Thông tin đội chơi.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| name | varchar | Team name |
| code | varchar | Unique code |
| created_at | timestamp | |
| updated_at | timestamp | |

### Constraints

```sql
UNIQUE(name)
UNIQUE(code)
```

---

## admins

Thông tin quản trị viên.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| name | varchar | |
| email | varchar | Unique |
| password | varchar | |
| created_at | timestamp | |
| updated_at | timestamp | |

### Constraints

```sql
UNIQUE(email)
```

---

## games

Thông tin game.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| name | varchar | |
| status | enum | pending / active / finished |
| started_at | timestamp nullable | |
| ended_at | timestamp nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## rounds

Thông tin round.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| game_id | bigint | FK -> games.id |
| round_number | integer | |
| status | enum | pending / active / finished |
| started_at | timestamp nullable | |
| ended_at | timestamp nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

### Constraints

```sql
UNIQUE(game_id, round_number)
```

### Indexes

```sql
INDEX(game_id)
INDEX(status)
```

---

## questions

Thông tin câu hỏi.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| round_id | bigint | FK -> rounds.id |
| content | text | |
| type | enum | single_choice / multiple_choice |
| time_limit_seconds | integer | |
| opened_at | timestamp nullable | |
| closed_at | timestamp nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

### Constraints

```sql
UNIQUE(round_id, order_number)
```

### Indexes

```sql
INDEX(round_id)
INDEX(status)
```

---

## answers

Danh sách đáp án.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| question_id | bigint | FK -> questions.id |
| content | text | |
| is_correct | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### Indexes

```sql
INDEX(question_id)
INDEX(is_correct)
```

---

## submissions

Lưu câu trả lời của team.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| question_id | bigint | FK -> questions.id |
| team_id | bigint | FK -> teams.id |
| answer_id | bigint | FK -> answers.id |
| is_correct | boolean | |
| response_time_ms | integer | Milliseconds |
| created_at | timestamp | Server timestamp lúc nộp |
| updated_at | timestamp | |

---

# Critical Constraint

Đây là constraint quan trọng nhất để chống duplicate.

```sql
UNIQUE(team_id, question_id)
```

---

## Indexes

```sql
INDEX(question_id)
INDEX(team_id)
INDEX(is_correct)
INDEX(created_at)
```

---

## round_results

Kết quả từng round.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| round_id | bigint | |
| team_id | bigint | |
| correct_count | integer | |
| total_response_time_ms | bigint | |
| rank | integer | |
| created_at | timestamp | |
| updated_at | timestamp | |

### Constraints

```sql
UNIQUE(round_id, team_id)
```

---

## game_results

Kết quả cuối game.

| Column | Type | Note |
|---|---|---|
| id | bigint | PK |
| game_id | bigint | |
| team_id | bigint | |
| total_correct_count | integer | |
| total_response_time_ms | bigint | |
| rank | integer | |
| is_winner | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### Constraints

```sql
UNIQUE(game_id, team_id)
```

---

# Concurrency Strategy

## Rule 1

Server là source of truth.

Frontend không quyết định thắng thua.

---

## Rule 2

Mỗi câu submit phải insert ngay vào DB.

Không lưu tạm localStorage để sync sau.

---

## Rule 3

Tất cả submit phải chạy trong DB transaction.

Ví dụ:

```php
DB::transaction(function () {
    ...
});
```

---

## Rule 4

Sử dụng unique constraint để chống race condition.

```sql
UNIQUE(team_id, question_id)
```

---

## Rule 5

Không trust client timestamp.

Server tự generate:

```php
now()
microtime(true)
```

---

# Recommended Database

Ưu tiên:

1. PostgreSQL
2. MySQL 8+

PostgreSQL được khuyến khích hơn do handling concurrency tốt hơn.
