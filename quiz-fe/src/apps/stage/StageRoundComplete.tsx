import { useEffect, useState } from "react";
import { Award, CheckCircle2, Timer, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { getPublicRoundResults, type RoundResult } from "../../services/gameService";

export default function StageRoundComplete({
  gameId: gameIdProp,
  completedRound: completedRoundProp,
  isPopup = false,
}: {
  gameId?: number | string;
  completedRound?: number;
  isPopup?: boolean;
}) {
  const [searchParams] = useSearchParams();
  const gameId = gameIdProp ?? (searchParams.get("gameId") || undefined);
  const completedRound = completedRoundProp ?? Number(searchParams.get("round") ?? 0);

  const [roundData, setRoundData] = useState<RoundResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !completedRound) {
      setLoading(false);
      return;
    }
    getPublicRoundResults(gameId)
      .then((res) => {
        const all = res.data.data ?? [];
        setRoundData(all.find((r) => r.round_number === completedRound) ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId, completedRound]);

  const topTeams = roundData?.top_teams ?? [];

  return (
    <div
      className={
        isPopup
          ? "bg-surface flex flex-col h-auto rounded-2xl shadow-lg"
          : "min-h-screen bg-surface flex flex-col pt-12 pb-20"
      }
      role={isPopup ? "dialog" : undefined}
      aria-modal={isPopup ? true : undefined}
    >
      <main
        className={
          isPopup
            ? "w-full px-6 py-6 overflow-auto max-h-[80vh]"
            : "flex-grow w-full max-w-5xl mx-auto px-6 flex flex-col"
        }
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg rotate-12"
          >
            <Award size={32} />
          </motion.div>
          <h1
            className={`${isPopup ? "text-3xl" : "text-4xl"} font-black text-gray-900 tracking-tighter mb-2`}
          >
            Round {completedRound || "?"} Complete
          </h1>
          <p className="text-gray-500 font-medium uppercase tracking-[0.3em] text-sm">
            Kết quả vòng này
          </p>
        </div>

        <h2
          className={`${isPopup ? "text-sm" : "text-3xl"} font-black text-center uppercase tracking-[0.2em] text-gray-400 mb-6`}
        >
          Bảng xếp hạng
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : topTeams.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {topTeams.map((team) => (
              <motion.div
                key={team.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: team.rank * 0.05 }}
                className="flex items-center justify-between px-6 py-5 border-b last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-lg ${
                      team.rank === 1
                        ? "bg-yellow-100 text-yellow-700"
                        : team.rank === 2
                          ? "bg-gray-100 text-gray-700"
                          : team.rank === 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {team.rank}
                  </div>
                  <p className={`font-black ${isPopup ? "text-base" : "text-xl"}`}>
                    {team.team_name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                    <CheckCircle2 size={14} />
                    <span>{team.correct_count} đúng</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-400">
                    <Timer size={14} />
                    <span className="font-mono">{team.total_time_seconds.toFixed(2)}s</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
