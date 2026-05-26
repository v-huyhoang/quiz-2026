import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trophy, Medal, Timer, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../libs/utils";
import { getLeaderboard, type LeaderboardEntry } from "../../services/gameService";

export default function StageLeaderBoard() {
  const [searchParams] = useSearchParams();
  const gameId          = Number(searchParams.get("gameId"));

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) { setLoading(false); return; }

    getLeaderboard(gameId)
      .then((res) => setEntries(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-12 flex flex-col">

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
              Leaderboard
            </h1>
            <p className="text-gray-500 font-medium uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE STANDINGS
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              TEAMS
            </span>
            <div className="text-3xl font-black text-secondary">
              {entries.length}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {entries.map((team, i) => (
            <motion.div
              key={team.team_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-white border p-6 rounded-xl flex items-center justify-between relative overflow-hidden",
                team.rank === 1
                  ? "border-secondary/30 ring-2 ring-secondary/10 shadow-md"
                  : "border-gray-200"
              )}
            >
              {team.rank === 1 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              )}

              <div className="flex items-center gap-6 relative z-10">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl",
                  team.rank === 1  ? "bg-secondary text-white"        :
                  team.rank <= 3   ? "bg-orange-100 text-orange-600"  :
                                     "bg-gray-100 text-gray-500"
                )}>
                  {team.rank === 1  ? <Trophy size={20} />  :
                   team.rank <= 3   ? <Medal size={20} />   :
                   team.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-none mb-1">
                    {team.team_name}
                  </h3>
                  <span className="text-xs font-bold text-gray-400 tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={12} /> {team.correct_count} CORRECT
                  </span>
                </div>
              </div>

              <div className="text-right relative z-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 flex items-center justify-end gap-1">
                  <Timer size={12} /> TOTAL TIME
                </p>
                <p className="text-3xl font-black text-gray-900 font-mono">
                  {team.total_time_seconds.toFixed(2)}s
                </p>
              </div>
            </motion.div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Trophy size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
