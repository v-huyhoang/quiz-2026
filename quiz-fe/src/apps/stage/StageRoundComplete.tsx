import { Award, Timer, Target, ArrowRight, Medal, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

export default function StageRoundComplete() {
  const navigate = useNavigate();

  const stats = [
    {
      label: "Total Questions",
      value: ROUND_STATS.totalQuestions,
      icon: <Target className="text-secondary" />,
    },
    {
      label: "Avg Correct Rate",
      value: `${ROUND_STATS.averageCorrectRate}%`,
      icon: <Award className="text-primary-container" />,
    },
    {
      label: "Fastest Answer",
      value: "1.2s",
      icon: <Timer className="text-primary" />,
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-12 pb-20">
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 flex flex-col">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg rotate-12"
          >
            <Award size={32} />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
            Round {ROUND_STATS.roundNumber} Complete
          </h1>
          <p className="text-gray-500 font-medium uppercase tracking-[0.3em]">
            FINAL RESULTS FOR THIS ROUND
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm text-center flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mb-3">
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Top 3 Teams */}
        <h2 className="text-xl font-black text-center uppercase tracking-[0.2em] text-gray-400 mb-6">
          Round Winners
        </h2>

        <div className="flex items-end justify-center gap-6 mb-12 h-64">
          {/* Rank 2 */}
          {TOP_TEAMS[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center w-48"
            >
              <div className="bg-white w-full rounded-t-2xl p-4 text-center border-t border-l border-r border-gray-200 shadow-sm relative z-10">
                <h3 className="font-bold text-gray-900 truncate">{TOP_TEAMS[1].name}</h3>
                <p className="text-xs text-gray-500 mt-1">{TOP_TEAMS[1].correctCount} / {ROUND_STATS.totalQuestions}</p>
                <p className="text-xs font-mono font-bold text-secondary mt-1">{(TOP_TEAMS[1].totalTimeMs / 1000).toFixed(2)}s</p>
              </div>
              <div className="w-full bg-gray-200 h-32 rounded-t-md flex items-start justify-center pt-4 shadow-inner">
                <Medal size={32} className="text-gray-400" />
              </div>
            </motion.div>
          )}

          {/* Rank 1 */}
          {TOP_TEAMS[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center w-56 relative -translate-y-8"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-secondary animate-bounce">
                <Trophy size={48} />
              </div>
              <div className="bg-white w-full rounded-t-2xl p-6 text-center border-t-2 border-l-2 border-r-2 border-secondary shadow-xl relative z-10">
                <h3 className="font-black text-lg text-gray-900 truncate">{TOP_TEAMS[0].name}</h3>
                <p className="text-sm text-gray-500 mt-1">{TOP_TEAMS[0].correctCount} / {ROUND_STATS.totalQuestions} CORRECT</p>
                <p className="text-sm font-mono font-black text-secondary mt-2">{(TOP_TEAMS[0].totalTimeMs / 1000).toFixed(2)}s</p>
              </div>
              <div className="w-full bg-gradient-to-b from-secondary to-orange-600 h-44 rounded-t-md flex items-start justify-center pt-6 shadow-inner">
                <span className="text-4xl font-black text-white/50">1</span>
              </div>
            </motion.div>
          )}

          {/* Rank 3 */}
          {TOP_TEAMS[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center w-48"
            >
              <div className="bg-white w-full rounded-t-2xl p-4 text-center border-t border-l border-r border-gray-200 shadow-sm relative z-10">
                <h3 className="font-bold text-gray-900 truncate">{TOP_TEAMS[2].name}</h3>
                <p className="text-xs text-gray-500 mt-1">{TOP_TEAMS[2].correctCount} / {ROUND_STATS.totalQuestions}</p>
                <p className="text-xs font-mono font-bold text-secondary mt-1">{(TOP_TEAMS[2].totalTimeMs / 1000).toFixed(2)}s</p>
              </div>
              <div className="w-full bg-orange-100 border border-orange-200 h-24 rounded-t-md flex items-start justify-center pt-4 shadow-inner">
                <Medal size={32} className="text-orange-400" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Temporary navigation for mock */}
        <div className="flex gap-4 mt-auto">
          <button
            onClick={() => navigate("/stage/leaderboard")}
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all text-sm"
          >
            [MOCK] NEXT ROUND
          </button>
          <button
            onClick={() => navigate("/stage/final")}
            className="flex-1 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm"
          >
            [MOCK] GAME FINAL <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
