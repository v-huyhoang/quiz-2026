# Requirement Document — Quiz Stack

# Overview

Quiz Stack là game thi đấu trả lời câu hỏi theo nhóm.

Mỗi nhóm có 1 người đại diện chơi.

Hệ thống cần đảm bảo:

- Realtime gameplay
- Data integrity
- Stable under concurrency
- Accurate scoring
- No duplicated submission

---

# Tech Stack

## Backend

- Laravel 12
- REST API
- Laravel Sanctum

## Frontend

- React
- Vite
- Axios
- Zustand hoặc Redux

## Database

- PostgreSQL hoặc MySQL

## Realtime

- Laravel Reverb hoặc Pusher

---

# Game Rules

- 16 teams
- 1 representative per team
- 3 rounds
- 5–10 questions per round
- Correct + fast answer wins
- Only 1 final winner

---

# Roles

## Admin

Có thể:

- Start game
- Start round
- Open question
- Close question
- View leaderboard
- Finish round
- Finish game

---

## Player

Có thể:

- Login
- Join game
- View question
- Submit answer
- View result

---

# Functional Requirements

## Authentication

### Player Login

Player login bằng:

- Email/password
hoặc
- Team code

---

# Game Management

## Admin can:

### Start game

- Chỉ 1 game active tại 1 thời điểm

### Start round

- Round phải theo thứ tự

### Open question

Khi open:

- Countdown bắt đầu
- Players nhận realtime event

### Close question

Khi close:

- Không cho submit thêm

---

# Question Submission

## Submit flow

Player submit:

```json
{
  "question_id": 1,
  "answer_id": 5
}
```

Backend:

1. Validate request
2. Check question open
3. Check user permission
4. Check duplicate submission
5. Save submission
6. Calculate correctness
7. Return response

---

# Important Rules

## Rule 1

1 team chỉ submit 1 lần cho mỗi question.

---

## Rule 2

Duplicate submit phải bị reject.

---

## Rule 3

Không cho submit sau timeout.

---

## Rule 4

Không trust frontend timestamp.

---

## Rule 5

Score phải tính từ database.

---

# Leaderboard

Leaderboard realtime gồm:

- Team name
- Correct answers
- Total response time
- Rank

---

# Winner Logic

Winner determined by:

1. Highest correct count
2. Lowest total response time
3. Earliest correct answer in final round

---

# Non Functional Requirements

## Performance

System phải handle:

- 16 concurrent submissions
- Stable under peak traffic
- API response < 300ms

---

## Reliability

System phải đảm bảo:

- No duplicated data
- No missing submissions
- No incorrect ranking

---

## Security

- Authenticated APIs only
- CSRF protection
- Rate limiting
- Prevent replay attack

---

# Realtime Requirements

Realtime events:

- game.started
- round.started
- question.opened
- question.closed
- submission.received
- leaderboard.updated
- game.finished

---

# UI Requirements

## Player Screen

- Current round
- Current question
- Countdown timer
- Answer list
- Submit button
- Submission status

---

## Admin Screen

- Start game
- Open question
- Close question
- Live leaderboard
- Team ranking
- Export result

---

# Logging

System cần log:

- Login
- Submission
- Duplicate submission
- Round result
- Final result
- Errors

---

# Future Scope

- Spectator mode
- Public leaderboard
- Mobile app
- AI-generated questions