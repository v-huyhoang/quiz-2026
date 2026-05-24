# Quiz Stack — Frontend

React 19 + Vite frontend cho hệ thống thi quiz real-time. Giao diện cho 3 người dùng: Admin (quản lý), Player (đội trưởng), Stage (màn chiếu).

## Yêu cầu

- Node.js 20+
- Yarn

## Setup

### Với Docker (từ root project)

```bash
# Từ thư mục gốc quiz-2026/
make setup   # Lần đầu
make up      # Các lần sau → http://localhost:5173
```

### Local dev (không Docker)

```bash
cd quiz-fe
cp .env.example .env    # Điền VITE_API_BASE_URL
yarn install
yarn dev                # http://localhost:5173
```

## Biến môi trường (`.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api

VITE_REVERB_APP_KEY=your-reverb-app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080

VITE_APP_URL=http://localhost:5173
```

## Scripts

```bash
yarn dev        # Dev server (HMR)
yarn build      # TypeScript check + Vite build → dist/
yarn lint       # ESLint
yarn preview    # Preview production build
```

## Cấu trúc thư mục

```
quiz-fe/src/
├── main.tsx                 # Entry point → <AppRoutes />
├── index.css                # Tailwind v4 + design tokens
├── apps/
│   ├── admin/               # Giao diện quản trị
│   │   ├── AdminLayout.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminQuestion.tsx    # Quản lý câu hỏi (CRUD + import)
│   │   ├── AdminRoom.tsx        # Quản lý phòng thi
│   │   ├── AdminGameControl.tsx # Điều khiển game
│   │   └── parts/
│   │       └── Navbar.tsx
│   ├── player/              # Giao diện đội trưởng
│   │   ├── PlayerLayout.tsx
│   │   ├── JoinRoom.tsx         # Nhập mã phòng + tên đội
│   │   ├── PlayerWaiting.tsx    # Màn hình chờ vào game
│   │   └── PlayerGame.tsx       # Trả lời câu hỏi
│   └── stage/               # Màn chiếu (TV/projector)
│       ├── StageLayout.tsx
│       ├── StageQuestion.tsx    # Hiển thị câu hỏi
│       ├── StageLeaderBoard.tsx # Bảng xếp hạng
│       ├── StageRoundComplete.tsx
│       ├── StageFinal.tsx       # Kết quả chung cuộc
│       └── StageWaitting.tsx    # Màn hình chờ
├── components/
│   ├── guards/
│   │   ├── AdminGuard.tsx       # Yêu cầu role === "admin"
│   │   └── PlayerGuard.tsx      # Yêu cầu role === "player"
│   └── Pagination.tsx
├── routes/
│   └── AppRoutes.tsx
├── services/
│   ├── api.ts                   # Axios instance + interceptors
│   ├── authService.ts           # adminLogin, adminLogout
│   └── roomService.ts           # joinRoom, createRoom, getRooms
├── store/
│   ├── authStore.ts             # Auth state (persist)
│   └── gameStore.ts             # Game state (ephemeral)
└── type/
    └── api.ts                   # ApiResponse<T>
```

## Routes

| Path | Component | Bảo vệ | Trạng thái |
|---|---|---|---|
| `/`, `/join` | JoinRoom | — | Mock |
| `/player/waiting` | PlayerWaiting | PlayerGuard | Mock |
| `/player/game` | PlayerGame | PlayerGuard | Mock |
| `/stage/question` | StageQuestion | — | Mock |
| `/stage/leaderboard` | StageLeaderBoard | — | Mock |
| `/stage/round-complete` | StageRoundComplete | — | Mock |
| `/stage/final` | StageFinal | — | Mock |
| `/admin/login` | AdminLogin | — | ✅ Real API |
| `/admin` | AdminDashboard | AdminGuard | Mock |
| `/admin/rooms` | AdminRoom | AdminGuard | Mock |
| `/admin/game-control` | AdminGameControl | AdminGuard | Mock |
| `/admin/question` | AdminQuestion | AdminGuard | ✅ Real API |
| `/admin/leaderboard` | StageLeaderBoard | AdminGuard | Mock |

## State Management

### `useAuthStore` — persist vào localStorage (`quiz-auth`)

```ts
{
  token: string | null
  teamId: number | null
  teamName: string | null
  gameId: number | null
  role: "player" | "admin" | null
}
```

Dùng để đính token vào mọi request (qua axios interceptor) và để route guards kiểm tra role.

### `useGameStore` — ephemeral (mất khi reload)

```ts
{
  gameId, roundId, roundNumber
  questionStatus: "pending" | "open" | "closed"
  currentQuestion: { id, content, options, openedAt, timeLimit }
  submittedQuestionIds: number[]
}
```

Dùng để quản lý trạng thái game real-time khi nhận WebSocket events.

## API Layer

`services/api.ts` — single axios instance:
- Tự động đính `Authorization: Bearer <token>` vào mọi request
- Khi nhận HTTP 401: xoá auth state → redirect về `/admin/login` hoặc `/join` theo role

### Response shape chuẩn

```ts
interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
}
```

## Design System

### Tailwind v4 Design Tokens

```css
--color-primary: #006876          /* teal */
--color-primary-container: #00bcd4
--color-secondary: #ac3509         /* burnt orange */
--color-surface: #f9f9f9
```

- Font: **Montserrat**
- Animation: `motion/react` (Framer Motion v12)
- Confetti: `canvas-confetti`
- Icons: `lucide-react`

## Docker

### Dev (hot reload)

```dockerfile
FROM node:20-alpine AS dev
# Volume mount → thay đổi code phản ánh ngay lập tức
yarn dev --host
```

### Production

```dockerfile
FROM node:20-alpine AS builder   # yarn build → dist/
FROM nginx:alpine AS prod         # serve dist/ qua nginx:80
```

Build production image:
```bash
make fe-prod-build
```
