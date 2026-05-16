# Business Logic — Quiz Stack

# Core Principles

## Principle 1

Server là source of truth.

Frontend chỉ hiển thị data.

---

## Principle 2

Mọi điểm số phải tính từ database.

---

## Principle 3

Mỗi team chỉ có 1 submission hợp lệ cho mỗi question.

---

# Game Flow

## Step 1 — Admin starts game

Game status:

```text
pending -> active
```

---

## Step 2 — Admin starts round

Round status:

```text
pending -> active
```

---

## Step 3 — Admin opens question

Question status:

```text
pending -> open
```

System:

- Broadcast realtime event
- Start countdown
- Allow submissions

---

## Step 4 — Player submits answer

Frontend sends:

```json
{
  "question_id": 10,
  "answer_id": 22
}
```

---

# Submission Logic

## Validation Steps

### Step 1

Check authenticated user.

---

### Step 2

Check user is representative.

```php
if (!$user->is_representative)
```

Reject if false.

---

### Step 3

Check game active.

---

### Step 4

Check round active.

---

### Step 5

Check question open.

---

### Step 6

Check timeout.

```php
now() <= question.closed_at
```

---

### Step 7

Check duplicate submission.

Using:

```sql
UNIQUE(team_id, question_id)
```

---

# Save Submission Logic

Submission phải chạy trong:

```php
DB::transaction()
```

---

# Submission Flow

## Inside transaction

### Step 1

Find correct answer.

---

### Step 2

Calculate correctness.

```php
$isCorrect = $answer->is_correct;
```

---

### Step 3

Calculate response time.

```php
$responseTime =
submitted_at - question.opened_at;
```

---

### Step 4

Insert submission.

---

### Step 5

Commit transaction.

---

# Duplicate Submission Handling

Nếu player spam submit:

- Request đầu tiên hợp lệ được lưu
- Request sau bị reject

Response:

```json
{
  "message": "Already submitted"
}
```

---

# Leaderboard Logic

Leaderboard calculated from:

```text
correct_count DESC
response_time ASC
```

---

# Round Result Logic

For each team:

```text
correct_count = total correct answers
total_response_time = sum(response time)
```

---

# Final Winner Logic

Winner priority:

1. Highest correct count
2. Lowest response time
3. Earliest correct answer in final round

---

# Question Close Logic

Khi admin close question:

```text
open -> closed
```

System:

- Reject future submissions
- Broadcast close event
- Update leaderboard

---

# Round Finish Logic

Khi round finish:

- Calculate rankings
- Save round_results
- Broadcast result

---

# Game Finish Logic

Khi game finish:

- Calculate final rankings
- Save game_results
- Determine winner
- Broadcast winner

---

# Realtime Logic

## Broadcast Events

### QuestionOpened

Payload:

```json
{
  "question_id": 1,
  "opened_at": "..."
}
```

---

### SubmissionReceived

Payload:

```json
{
  "team_id": 1,
  "is_correct": true
}
```

---

### LeaderboardUpdated

Payload:

```json
[
  {
    "team": "A",
    "score": 10
  }
]
```

---

# Failure Handling

## Case 1 — Duplicate submit

Reject request.

---

## Case 2 — Timeout

Reject request.

---

## Case 3 — Invalid answer

Reject request.

---

## Case 4 — DB failure

Rollback transaction.

---

# Security Logic

## Prevent Replay Attack

Use:

- Auth token
- Expired question validation
- Unique submission constraint

---

# Audit Requirements

Need logs for:

- Submission time
- User ID
- Team ID
- Correctness
- Response time
- Duplicate attempts

---

# Important Technical Decision

## Why not localStorage?

localStorage:

- Can be modified
- Can be lost
- Not atomic
- Not reliable

Therefore:

```text
Frontend != source of truth
Database = source of truth
```