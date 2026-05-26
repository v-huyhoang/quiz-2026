import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Group, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { getPublicGameState, type GameTeam } from "../../services/gameService";

const MAX_TEAMS = 16;

export default function StageWaitting() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const gameId          = Number(searchParams.get("gameId"));

  const [teams, setTeams] = useState<GameTeam[]>([]);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res   = await getPublicGameState(gameId);
        const state = res.data.data;

        if (!cancelled) {
          setTeams(state.teams);

          if (state.current_round?.current_question?.status === "open") {
            navigate(`/stage/question?gameId=${gameId}`, { replace: true });
            return;
          }

          if (state.status === "finished") {
            navigate(`/stage/final?gameId=${gameId}`, { replace: true });
            return;
          }
        }
      } catch {
        // ignore
      }

      if (!cancelled) setTimeout(poll, 2000);
    };

    poll();
    return () => { cancelled = true; };
  }, [gameId, navigate]);

  const emptySlots = MAX_TEAMS - teams.length;

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center gap-4 mb-12 w-full text-center relative overflow-hidden shadow-sm"
        >
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
            <h1 className="text-2xl font-bold text-primary uppercase tracking-widest">
              Connected to Arena
            </h1>
          </div>
          <p className="text-gray-500 font-medium z-10">Waiting for admin to start...</p>
          <div className="w-full h-2 bg-gray-100 mt-4 rounded-full overflow-hidden z-10">
            <motion.div
              animate={{ width: `${(teams.length / MAX_TEAMS) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </motion.div>

        <div className="w-full flex flex-col gap-8">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-gray-900">Lobby Roster</h2>
            <div className="text-5xl font-black text-primary">
              {teams.length}
              <span className="text-xl text-gray-300">/{MAX_TEAMS}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>

        <div className="mt-12 flex items-center gap-2 text-gray-400">
          <Group size={14} />
          <p className="text-xs font-medium">Game will start when host gives the signal</p>
        </div>
      </main>
    </div>
  );
}
