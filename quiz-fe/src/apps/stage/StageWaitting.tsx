import { useCallback, memo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, Layers, HelpCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { getPublicGameState, type GameTeam, type GameState } from "../../services/gameService";
import { getRoomByCode } from "../../services/roomService";
import backgroundImage from "../../assets/background.png";
import waveImage from "../../assets/wave.png";
import Header from "../../components/Header";
import { GridBg } from "../../components/ui/GridBg";
import { useGameSocket } from "../../hooks/useGameSocket";

const MAX_TEAMS = 16;
const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

type GameInfo = Pick<GameState, "name" | "access_code" | "rounds_total" | "questions_per_round">;

export default function StageWaitting() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = searchParams.get("room") ?? "";

  const [gameId, setGameId]         = useState<number | null>(null);
  const [gameInfo, setGameInfo]     = useState<GameInfo | null>(null);
  const [teams, setTeams]           = useState<GameTeam[]>([]);
  const [lastJoined, setLastJoined] = useState<string | null>(null);
  const [lastLeft, setLastLeft]     = useState<string | null>(null);

  // ── Fetch room by code then load initial game state ────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    getRoomByCode(roomCode)
      .then((room) => {
        setGameId(room.id);
        return getPublicGameState(room.id);
      })
      .then((res) => {
        const d = res.data.data;
        setTeams(d.teams);
        setGameInfo({
          name: d.name,
          access_code: d.access_code,
          rounds_total: d.rounds_total,
          questions_per_round: d.questions_per_round,
        });
      })
      .catch(() => {});
  }, [roomCode]);

  const clearJoined = useCallback(() => setLastJoined(null), []);
  const clearLeft   = useCallback(() => setLastLeft(null), []);

  // ── WebSocket subscription ─────────────────────────────────────────────────
  useGameSocket(gameId, {
    ".team.joined": (data: { team: GameTeam }) => {
      setTeams((prev) =>
        prev.some((t) => t.id === data.team.id) ? prev : [...prev, data.team]
      );
      setLastJoined(data.team.name);
      setLastLeft(null);
    },
    ".team.left": (data: { team: GameTeam }) => {
      setTeams((prev) => prev.filter((t) => t.id !== data.team.id));
      setLastLeft(data.team.name);
      setLastJoined(null);
    },
    ".game.started": () => {
      navigate(`/stage/question?gameId=${gameId}`, { replace: true });
    },
    ".question.started": () => {
      navigate(`/stage/question?gameId=${gameId}`, { replace: true });
    },
    ".game.finished": () => {
      navigate(`/stage/final?gameId=${gameId}`, { replace: true });
    },
  });

  const joinUrl    = gameInfo ? `${APP_URL}/join?room=${gameInfo.access_code}` : "";
  const emptySlots = Math.max(0, MAX_TEAMS - teams.length);

  return (
    <div
      className="min-h-screen bg-surface flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `
          url(${backgroundImage})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Top bar */}
      <Header title="Sảnh chờ" />

      <main className="grow w-full max-w-7xl mx-auto px-8 py-10 grid grid-cols-[1fr_320px] gap-10">
        <img
          src={waveImage}
          alt="waveImage"
          className="absolute w-1/3 h-1/3 bottom-0 right-0 opacity-40 pointer-events-none select-none z-0"
        />

        {/* ── Left: game title + team grid ─────────────────────────────── */}
        <div className="flex flex-col gap-8 min-w-0">
          {gameInfo && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Trò chơi</p>
              <h1 className="text-5xl font-black text-gray-900 leading-tight truncate">{gameInfo.name}</h1>
            </motion.div>
          )}

          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Đội đã tham gia</span>
              <span className="text-4xl font-black text-primary tabular-nums">
                {teams.length}
                <span className="text-xl text-gray-400 font-bold">/{MAX_TEAMS}</span>
              </span>
            </div>
            <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(teams.length / MAX_TEAMS) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

          {/* Team grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teams.map((team, index) => (
              <StageTeamCard key={team.id} team={team} index={index} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-2 border-dashed border-gray-400 bg-gray-50/40 p-3 rounded-xl flex items-center gap-3 opacity-40"
              >
                <div className="w-10 h-10 rounded-full border border-gray-900 flex items-center justify-center text-gray-300 shrink-0">
                  <UserPlus className="text-gray-900" size={16} />
                </div>
                <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Trống</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: QR code + access code ─────────────────────────────── */}
        <div className="flex flex-col items-center gap-6 sticky top-10 self-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-md w-full"
          >
            <p className="text-[16px] font-black text-gray-400 uppercase tracking-[0.25em]">Quét để tham gia</p>

            <div className="p-3 bg-white rounded-xl border-2 border-gray-100">
              {joinUrl ? (
                <QRCodeSVG value={joinUrl} size={200} bgColor="#ffffff" fgColor="#1a1a2e" level="M" />
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-100 rounded-lg animate-pulse" />
              )}
            </div>

            {gameInfo && (
              <>
                <div className="w-full border-t border-gray-100 pt-4 flex flex-col items-center gap-1">
                  <p className="text-[14px] font-bold text-gray-400 uppercase tracking-[0.2em]">Mã phòng</p>
                  <p className="text-4xl font-extrabold text-primary font-mono tracking-widest">
                    {gameInfo.access_code}
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed">
                  Truy cập <span className="font-bold text-gray-600 break-all">{APP_URL}/join?room={gameInfo.access_code}</span><br />
                  hoặc quét mã QR bên trên
                </p>
              </>
            )}
          </motion.div>

          {gameInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 w-full shadow-sm"
            >
              <p className="text-[14px] text-center font-black text-gray-400 uppercase tracking-[0.25em] mb-6">
                Thông tin trò chơi
              </p>
              <div className="space-y-3">
                <GameInfoRow icon={<Layers size={14} />} label="Số vòng đấu" value={gameInfo.rounds_total} />
                <GameInfoRow icon={<HelpCircle size={14} />} label="Câu hỏi / vòng" value={gameInfo.questions_per_round} />
                <GameInfoRow
                  icon={<HelpCircle size={14} />}
                  label="Tổng câu hỏi"
                  value={gameInfo.rounds_total * gameInfo.questions_per_round}
                />
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Toast notifications */}
      <AnimatePresence>
        {lastJoined && (
          <JoinToast
            key={"join-" + lastJoined + teams.length}
            name={lastJoined}
            type="join"
            onDone={clearJoined}
          />
        )}
        {lastLeft && (
          <JoinToast
            key={"left-" + lastLeft + teams.length}
            name={lastLeft}
            type="leave"
            onDone={clearLeft}
          />
        )}
      </AnimatePresence>

      <GridBg opacity={0.03} />
    </div>
  );
}

// ── Pure sub-components ───────────────────────────────────────────────────────

const StageTeamCard = memo(function StageTeamCard({ team, index }: { team: GameTeam; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.04 }}
      className="bg-white border-2 border-primary/25 p-3 rounded-xl flex items-center gap-3 shadow-sm"
    >
      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-black text-base">
        {team.name.charAt(0).toUpperCase()}
      </div>
      <p className="text-xs font-black text-gray-900 truncate uppercase tracking-wide flex-1">{team.name}</p>
    </motion.div>
  );
});

// const StageEmptySlot = memo(function StageEmptySlot() {
//   return (
//     <div className="border-2 border-dashed border-gray-200 bg-gray-50/40 p-3 rounded-xl flex items-center gap-3 opacity-40">
//       <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-300 shrink-0">
//         <UserPlus size={16} />
//       </div>
//       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trống</p>
//     </div>
//   );
// });

const GameInfoRow = memo(function GameInfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <span className="text-xl font-black text-gray-900">{value}</span>
    </div>
  );
});

function JoinToast({
  name,
  type,
  onDone,
}: {
  name: string;
  type: "join" | "leave";
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => setTimeout(onDone, 2500)}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-white shadow-lg px-5 py-3 rounded-2xl ${
        type === "join" ? "border border-primary/20" : "border border-orange-200"
      }`}
    >
      {type === "join" ? (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
      ) : (
        <LogOut size={14} className="text-orange-500 shrink-0" />
      )}
      <span className="text-sm font-bold text-gray-700">
        <span className={`font-black uppercase truncate ${type === "join" ? "text-primary" : "text-orange-500"}`}>
          "{name}"
        </span>{" "}
        {type === "join" ? "vừa tham gia!" : "đã rời phòng"}
      </span>
    </motion.div>
  );
}
