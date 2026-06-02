# Quiz Game Test Bot

E2E test bot mô phỏng N player tham gia game thực tế. Mỗi player chạy trong browser context riêng biệt (localStorage, session, cookie độc lập).

## Yêu cầu

- Node.js >= 18
- Quiz Stack backend + frontend đang chạy
- Admin đã tạo phòng và sẵn sàng điều khiển game

## Cài đặt

```bash
cd game-test-bot
npm install
npx playwright install chromium
```

## Cấu hình

Chỉnh `config/config.json`:

```json
{
  "baseUrl": "http://localhost:5173",   // URL frontend
  "roomCode": "ABC123",                 // Mã phòng (access_code)
  "teamCount": 10,                      // Số lượng bot player
  "headless": false,                    // false = thấy browser, true = ẩn
  "submitDelayMinMs": 300,              // Delay tối thiểu trước khi submit
  "submitDelayMaxMs": 2000,             // Delay tối đa trước khi submit
  "randomAnswer": true,                 // true = random, false = luôn chọn A
  "screenshotOnError": true,            // Chụp ảnh khi có lỗi
  "questionTimeoutMs": 60000            // Timeout mỗi câu hỏi (ms)
}
```

## Chạy

```bash
npm run start
```

## Quy trình

1. Bot tạo N browser context độc lập (mỗi context = 1 player)
2. Tất cả player join room đồng thời
3. Chờ admin bắt đầu game
4. Khi `.game.started` → vào trạng thái chờ câu hỏi
5. Khi `.question.started` → delay ngẫu nhiên → chọn đáp án → submit
6. Khi `.question.closed` → chờ câu tiếp theo
7. Khi `.round.finished` → chờ round tiếp theo
8. Khi `.game.finished` → chụp screenshot + đóng context
9. Sinh report vào `reports/result.json`
10. Process tự thoát

## Admin cần làm

Tool chỉ đóng vai player. Admin tự thực hiện:

1. Login admin
2. Tạo phòng (access_code phải khớp với `roomCode` trong config)
3. Start Game
4. (Với mỗi round): Start Round
5. (Với mỗi câu hỏi): Open Question → Close Question
6. Finish Round
7. Finish Game

## Output

- `reports/result.json` — JSON report tổng kết
- `reports/session.log` — Log chi tiết từng player
- `screenshots/` — Screenshots khi lỗi hoặc game kết thúc

## Ví dụ report

```json
{
  "roomCode": "ABC123",
  "totalTeams": 10,
  "joinedTeams": 10,
  "completedTeams": 10,
  "questionsAnswered": 150,
  "successfulSubmissions": 148,
  "failedSubmissions": 2,
  "duration": "18m42s"
}
```

## Scale

Hỗ trợ `teamCount` từ 1 đến 100. Các context chạy song song, không blocking nhau. Một context crash không ảnh hưởng các context khác.
