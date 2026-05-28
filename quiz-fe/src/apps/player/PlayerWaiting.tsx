import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Group, UserPlus, Clock } from "lucide-react";
import { motion } from "motion/react";
import { useGameStore } from "../../store/gameStore";
import { useAuthStore } from "../../store/authStore";
import { getPublicGameState, type GameTeam } from "../../services/gameService";
import { getGameChannel } from "../../sockets/channels/game-channel";
import { getEcho } from "../../sockets/echo";

const MAX_TEAMS = 16;

export default function PlayerWaiting() {
  const { teamName, teamId, gameId } = useAuthStore();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<GameTeam[]>([]);
  const { gameStatus, currentQuestion } = useGameStore();

  // ── Initial state fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    getPublicGameState(gameId)
      .then((res) => setTeams(res.data.data.teams))
      .catch(() => { });
  }, [gameId]);

  // ── WebSocket subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;

    const channel = getGameChannel(String(gameId));

    channel.listen(".team.joined", (data: { team: GameTeam }) => {
      setTeams((prev) =>
        prev.some((t) => t.id === data.team.id) ? prev : [...prev, data.team]
      );
    });

    channel.listen(".game.started", () => {
      navigate("/player/game", { replace: true });
    });

    return () => {
      getEcho().leave(`game.${gameId}`);
    };
  }, [gameId, navigate]);

  useEffect(() => {
    if (gameStatus === "active" || currentQuestion) {
      navigate("/player/game");
    }
  }, [currentQuestion, gameStatus, navigate]);

  const emptySlots = MAX_TEAMS - teams.length;

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center gap-4 mb-12 w-full text-center relative overflow-hidden shadow-sm"
        >
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-center gap-3 mb-1">
            <div
              className={`w-3 h-3 rounded-full ${gameStatus === "active" ? "bg-green-500" : "bg-primary"} ${gameStatus === "active" ? "animate-pulse" : "animate-ping"}`}
            />
            <h1
              className={`text-2xl font-bold uppercase tracking-widest ${gameStatus === "active" ? "text-green-600" : "text-primary"}`}
            >
              {gameStatus === "active" ? "Game has started" : "Đã kết nối"}
            </h1>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Đội của bạn</p>
            <p className="text-2xl font-black text-gray-900">{teamName ?? "Unknown Team"}</p>
            <p className="text-xs text-gray-400 font-mono">#{teamId}</p>
          </div>

          <div className="relative z-10 flex items-center gap-2 mt-2">
            <Clock
              size={14}
              className={
                gameStatus === "active"
                  ? "animate-pulse text-green-600"
                  : "animate-pulse text-gray-500"
              }
            />
            <p
              className={`font-medium text-sm ${gameStatus === "active" ? "text-green-600" : "text-gray-500"}`}
            >
              {gameStatus === "active"
                ? "Please wait for question..."
                : "Chờ Host bắt đầu..."}
            </p>
          </div>

          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden z-10">
            <motion.div
              animate={{ width: `${(teams.length / MAX_TEAMS) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </motion.div>

        {/* Team list */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-gray-900">Sảnh chờ</h2>
            <div className="text-4xl font-black text-primary">
              {teams.length}
              <span className="text-xl text-gray-300">/{MAX_TEAMS}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white border-2 p-4 rounded-xl flex items-center gap-3 shadow-sm ${team.id === teamId ? "border-primary shadow-primary/20" : "border-primary/30"
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-sm font-black">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-gray-900 truncate uppercase tracking-wide">
                    {team.name}
                  </p>
                  {team.id === teamId && (
                    <p className="text-[10px] text-primary font-bold">Bạn</p>
                  )}
                </div>
              </motion.div>
            ))}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 rounded-xl flex items-center gap-3 opacity-40"
              >
                <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-300">
                  <UserPlus size={16} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trống</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center gap-2 text-gray-400">
          <Group size={14} />
          <p className="text-xs font-medium">Game sẽ bắt đầu khi Host ra lệnh</p>
        </div>
      </main>
    </div>
  );
}
