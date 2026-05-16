import { Trophy, Medal, Timer, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "../../libs/utils";

// Mock data: Round leaderboard
const MOCK_LEADERBOARD = [
  { rank: 1, name: "Neon Knights", correctCount: 8, totalTimeMs: 14500, status: "submitted" },
  { rank: 2, name: "Data Demons", correctCount: 8, totalTimeMs: 16200, status: "submitted" },
  { rank: 3, name: "Query Queens", correctCount: 7, totalTimeMs: 12100, status: "submitted" },
  { rank: 4, name: "Byte Brawlers", correctCount: 6, totalTimeMs: 18000, status: "submitted" },
  { rank: 5, name: "The Alchemists", correctCount: 5, totalTimeMs: 15500, status: "submitted" },
  { rank: 6, name: "Logic Lords", correctCount: 5, totalTimeMs: 19200, status: "playing" },
];

export default function StageLeaderBoard() {
  const navigate = useNavigate();

  // Mock: "12/16 answered"
  const totalTeams = 16;
  const submittedCount = MOCK_LEADERBOARD.filter(t => t.status === "submitted").length;

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-12 flex flex-col">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
              Round Leaderboard
            </h1>
            <p className="text-gray-500 font-medium uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              ROUND 01 IN PROGRESS
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              TEAMS SUBMITTED
            </span>
            <div className="text-3xl font-black text-secondary">
              {submittedCount} / {totalTeams}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {MOCK_LEADERBOARD.map((team, i) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-white border p-6 rounded-xl flex items-center justify-between transition-all cursor-pointer relative overflow-hidden",
                team.rank === 1
                  ? "border-secondary/30 ring-2 ring-secondary/10 shadow-md"
                  : "border-gray-200",
                team.status === "submitted" ? "bg-white" : "bg-gray-50 opacity-70"
              )}
              onClick={() => navigate("/stage/round-complete")} // For mock navigation
            >
              {team.rank === 1 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              )}
              
              <div className="flex items-center gap-6 relative z-10">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl",
                    team.rank === 1
                      ? "bg-secondary text-white"
                      : team.rank <= 3
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {team.rank === 1 ? <Trophy size={20}/> : team.rank <= 3 ? <Medal size={20}/> : team.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-none mb-1 flex items-center gap-2">
                    {team.name}
                    {team.status === "submitted" && <CheckCircle2 size={16} className="text-green-500"/>}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-bold text-gray-400 tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={12}/> {team.correctCount} CORRECT
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right relative z-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 flex items-center justify-end gap-1">
                  <Timer size={12}/> RESPONSE TIME
                </p>
                <p className="text-3xl font-black text-gray-900 font-mono">
                  {(team.totalTimeMs / 1000).toFixed(2)}s
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Temporary button for navigation during mock phase */}
        <button 
          onClick={() => navigate("/stage/round-complete")}
          className="w-full mt-12 py-5 bg-white border border-gray-200 text-gray-500 font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all"
        >
          [MOCK] TRIGGER ROUND FINISH (GO TO ROUND COMPLETE)
        </button>
      </main>
    </div>
  );
}
