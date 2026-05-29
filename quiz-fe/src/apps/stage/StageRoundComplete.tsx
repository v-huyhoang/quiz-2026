import { Award } from "lucide-react";
import { motion } from "motion/react";

// Mock data
const ROUND_STATS = {
  roundNumber: 1,
  totalQuestions: 10,
  averageCorrectRate: 68, // 68%
};

const TOP_TEAMS = [
  { rank: 1, name: "Neon Knights", correctCount: 8, totalTimeMs: 14500 },
  { rank: 2, name: "Data Demons", correctCount: 8, totalTimeMs: 16200 },
  { rank: 3, name: "Query Queens", correctCount: 7, totalTimeMs: 12100 },
];

export default function StageRoundComplete({ isPopup = false }: { isPopup?: boolean }) {

  return (
    <div className={isPopup ? "bg-surface flex flex-col h-auto rounded-2xl shadow-lg" : "min-h-screen bg-surface flex flex-col pt-12 pb-20"} role={isPopup ? "dialog" : undefined} aria-modal={isPopup ? true : undefined}>
      <main className={isPopup ? "w-full px-6 py-6 overflow-auto max-h-[80vh]" : "flex-grow w-full max-w-5xl mx-auto px-6 flex flex-col"}>
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg rotate-12"
          >
            <Award size={32} />
          </motion.div>
          <h1 className={`${isPopup ? 'text-3xl' : 'text-4xl'} font-black text-gray-900 tracking-tighter mb-2`}>
            Round {ROUND_STATS.roundNumber} Complete
          </h1>
          <p className="text-gray-500 font-medium uppercase tracking-[0.3em]">
            FINAL RESULTS FOR THIS ROUND
          </p>
        </div>

        {/* Top 3 Teams */}
        <h2 className={`${isPopup ? 'text-sm' : 'text-3xl'} font-black text-center uppercase tracking-[0.2em] text-gray-400 mb-6`}>
          Round Winners
        </h2>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {TOP_TEAMS.map((team) => (
            <div
              key={team.rank}
              className="flex items-center justify-between px-6 py-6 border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black
          ${team.rank === 1
                      ? "bg-yellow-100 text-yellow-700"
                      : team.rank === 2
                        ? "bg-gray-100 text-gray-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                >
                  {team.rank}
                </div>

                <div>
                  <p className="text-xl font-black">{team.name}</p>
                </div>
              </div>

              <div className="text-lg font-black font-mono text-secondary">
                {(team.totalTimeMs / 1000).toFixed(2)}s
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
