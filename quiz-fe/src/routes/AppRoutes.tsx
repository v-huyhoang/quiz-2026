import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Guards
import PlayerGuard from "../components/guards/PlayerGuard";
import AdminGuard from "../components/guards/AdminGuard";

// Layouts
import PlayerLayout from "../apps/player/PlayerLayout";
import StageLayout from "../apps/stage/StageLayout";
import AdminLayout from "../apps/admin/AdminLayout";

// Player screens
import JoinRoom from "../apps/player/JoinRoom";
import PlayerLogin from "../apps/player/PlayerLogin";
import PlayerWaiting from "../apps/player/PlayerWaiting";
import PlayerGame from "../apps/player/PlayerGame";

// Stage screens
import StageWaitting from "../apps/stage/StageWaitting";
import StageLeaderBoard from "../apps/stage/StageLeaderBoard";
import StageRoundComplete from "../apps/stage/StageRoundComplete";
import StageFinal from "../apps/stage/StageFinal";
import StageGame from "../apps/stage/StageGame";

// Admin screens
import AdminLogin from "../apps/admin/AdminLogin";
import AdminDashboard from "../apps/admin/AdminDashboard";
import AdminGameControl from "../apps/admin/AdminGameControl";
import { AdminQuestion } from "../apps/admin/AdminQuestion";
import { AdminRoom } from "../apps/admin/AdminRoom";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/join" element={<JoinRoom />} />

        <Route path="/player/login" element={<PlayerLogin />} />

        <Route element={<PlayerGuard />}>
          <Route element={<PlayerLayout />}>
            <Route path="/player/waiting" element={<PlayerWaiting />} />
            <Route path="/player/game" element={<PlayerGame />} />
          </Route>
        </Route>

        <Route path="/stage" element={<StageLayout />}>
          <Route path="waiting" element={<StageWaitting />} />
          <Route path="question" element={<StageGame />} />
          <Route path="leaderboard" element={<StageLeaderBoard />} />
          <Route path="round-complete" element={<StageRoundComplete />} />
          <Route path="final" element={<StageFinal />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/rooms" element={<AdminRoom />} />
            <Route path="/admin/game-control/:gameId" element={<AdminGameControl />} />
            <Route path="/admin/question" element={<AdminQuestion />} />
            <Route path="/admin/leaderboard" element={<StageLeaderBoard />} />
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
