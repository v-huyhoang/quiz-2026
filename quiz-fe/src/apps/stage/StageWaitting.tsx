import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Group, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { getPublicGameState, type GameTeam } from "../../services/gameService";
import { getRoomByCode } from "../../services/roomService";
import { getGameChannel } from "../../sockets/channels/game-channel";
import { getEcho } from "../../sockets/echo";

const MAX_TEAMS = 16;
const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

export default function StageWaitting() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const gameId          = Number(searchParams.get("gameId"));
  const roomCode        = searchParams.get("roomCode");

  const [teams, setTeams] = useState<GameTeam[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);

  // ── Initial state fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    getPublicGameState(gameId)
      .then((res) => setTeams(res.data.data.teams))
      .catch(() => {});
  }, [gameId]);

  // ── Fetch room info by code ────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    getRoomByCode(roomCode)
      .then((res) => {
        setRoomInfo(res);
        if (res.id && !gameId) {
          getPublicGameState(res.id)
            .then((gameRes) => setTeams(gameRes.data.data.teams))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [roomCode, gameId]);

  // ── WebSocket subscription ─────────────────────────────────────────────────
  useEffect(() => {
    const currentGameId = gameId || roomInfo?.id;
    if (!currentGameId) return;

    const channel = getGameChannel(String(currentGameId));

    channel.listen(".team.joined", (data: { team: GameTeam }) => {
      setTeams((prev) =>
        prev.some((t) => t.id === data.team.id) ? prev : [...prev, data.team]
      );
    });

    channel.listen(".game.started", () => {
      navigate(`/stage/question?gameId=${currentGameId}`, { replace: true });
    });

    channel.listen(".game.finished", () => {
      navigate(`/stage/final?gameId=${currentGameId}`, { replace: true });
    });

    return () => {
      getEcho().leave(`game.${currentGameId}`);
    };
  }, [gameId, roomInfo, navigate]);

  const emptySlots = MAX_TEAMS - teams.length;
  const joinUrl = roomCode ? `${APP_URL}/join?room=${roomCode}` : "";

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8">

        {/* Top section with QR Code and status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Code Section */}
          {roomCode && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center gap-4 text-center relative overflow-hidden shadow-sm"
            >
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
             
              <h3 className="text-xl font-black text-gray-900 z-10">
                {roomInfo?.name || "Join Room"}
              </h3>
              <p className="text-sm text-gray-400 z-10">Scan the code to join</p>
              <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm z-10">
                <QRCodeSVG
                  value={joinUrl}
                  size={180}
                  fgColor="#006876"
                  level="M"
                />
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-5 py-2 rounded-full z-10">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Room Code:
                </span>
                <span className="text-lg font-black text-primary font-mono">
                  {roomCode}
                </span>
              </div>
            </motion.div>
          )}

          {/* Status Section - Lobby Roster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${roomCode ? "lg:col-span-2" : "lg:col-span-3"} bg-white border border-gray-200 p-8 rounded-xl flex flex-col gap-6 relative overflow-hidden shadow-sm`}
          >
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
                <h1 className="text-3xl font-bold text-primary uppercase tracking-widest">
                  Connected
                </h1>
              </div>
              <p className="text-gray-500 font-medium text-lg">Waiting for admin to start...</p>
              <div className="w-full max-w-md h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(teams.length / MAX_TEAMS) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <div className="text-6xl font-black text-primary">
                {teams.length}
                <span className="text-2xl text-gray-300">/{MAX_TEAMS}</span>
              </div>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              {teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white border-2 border-primary/30 p-4 rounded-lg flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">
                      {team.name}
                    </p>
                    <p className="text-xs text-primary font-bold">Ready</p>
                  </div>
                </motion.div>
              ))}

              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={i}
                  className="border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 rounded-lg flex items-center gap-4 opacity-50"
                >
                  <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-300">
                    <UserPlus size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empty Slot</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex items-center gap-2 text-gray-400">
          <Group size={14} />
          <p className="text-xs font-medium">Game will start when host gives the signal</p>
        </div>
      </main>
    </div>
  );
}
