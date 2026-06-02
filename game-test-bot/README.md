# Quiz Stack 2026 — E2E Test Bot

Mô phỏng nhiều player thật tham gia và chơi game quiz. Mỗi player chạy trong browser context độc lập (localStorage/cookie riêng).

## Yêu cầu

- Node.js ≥ 18
- npm ≥ 9

## Cài đặt

```bash
npm install
npm run install:browsers   # tải Chromium của Playwright
```

Hoặc từ root project:

```bash
make bot-install
```

## Chạy

```bash
npm start
```

Từ root project:

```bash
make bot-start
```

Với CLI args:

```bash
make bot-run roomId=XYZ123 teamCount=10 headless=true
```

Hoặc trực tiếp:

```bash
node src/index.js --roomId=XYZ123 --teamCount=10 --headless=true
```

## Cấu hình

Sửa `config/config.json`:

| Field | Mô tả | Mặc định |
|---|---|---|
| `baseUrl` | URL frontend | `http://localhost:5173` |
| `roomId` | Room code do Admin cung cấp | `ABC123` |
| `teamCount` | Số player bot | `20` |
| `browser` | `chromium` / `chrome` / `edge` | `chromium` |
| `headless` | Ẩn browser | `false` |
| `submitDelayMinMs` | Delay tối thiểu trước submit (ms) | `300` |
| `submitDelayMaxMs` | Delay tối đa trước submit (ms) | `2000` |
| `randomAnswer` | Chọn đáp án ngẫu nhiên | `true` |
| `screenshotOnError` | Chụp màn hình khi lỗi | `true` |

CLI args sẽ override config.json.

## Quy trình bot

```
Admin tạo phòng + cung cấp Room ID
          ↓
Bot mở {baseUrl}/join?room={roomId} cho mỗi player (context riêng)
          ↓
Nhập tên đội (Team 1 … Team N)
          ↓
Vào /player/waiting — chờ Admin bắt đầu game
          ↓
Admin click "Bắt đầu game" → WebSocket .game.started
          ↓
Tất cả bot chuyển sang /player/game
          ↓
Vòng lặp: đợi câu hỏi → chọn ngẫu nhiên → delay → submit
          ↓
Admin điều khiển: mở/đóng câu, kết thúc vòng, kết thúc game
          ↓
Bot kết thúc → chụp screenshot → xuất report
```

## Output

| Đường dẫn | Nội dung |
|---|---|
| `reports/result.json` | Report mới nhất |
| `reports/result-{timestamp}.json` | Lịch sử report |
| `screenshots/{team}-finished.png` | Màn hình cuối mỗi player |
| `screenshots/{team}-*-error.png` | Màn hình khi có lỗi |

## Lưu ý quan trọng

- Bot chỉ đóng vai **Player**. Admin phải điều khiển game thủ công.
- Mỗi player dùng `browser.newContext()` riêng → không chia sẻ localStorage.
- Không poll API liên tục — bot phản ứng theo DOM changes (trạng thái do WebSocket cập nhật).
- Lỗi 409 (duplicate submit) được bỏ qua tự động.
