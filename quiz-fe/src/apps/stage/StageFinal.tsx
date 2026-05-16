import { useEffect } from "react";
import { Trophy, Star, ArrowRight, Medal, Timer, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import confetti from "canvas-confetti";

// Mock Data
const OVERALL_CHAMPION = {
  name: "Neon Knights",
  totalCorrect: 25,
  totalTimeMs: 45200,
  winStreak: 3,
};

const FULL_LEADERBOARD = [
  { rank: 1, name: "Neon Knights", correctCount: 25, totalTimeMs: 45200 },
  { rank: 2, name: "Data Demons", correctCount: 24, totalTimeMs: 48000 },
  { rank: 3, name: "Query Queens", correctCount: 22, totalTimeMs: 42100 },
  { rank: 4, name: "Byte Brawlers", correctCount: 19, totalTimeMs: 51000 },
  { rank: 5, name: "The Alchemists", correctCount: 18, totalTimeMs: 49500 },
];

export default function StageFinal() {
  const navigate = useNavigate();

  useEffect(() => {
    // Fire confetti on mount
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-primary flex flex-col p-6 relative overflow-y-auto text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-container/20 via-transparent to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-secondary/10 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-12 mt-12 mb-12">
        {/* Left Column: Champion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center text-center"
        >
          <div className="relative mb-12 mt-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-16 opacity-20 pointer-events-none"
            >
              {[...Array(12)].map((_, i) => (
                <Star
                  key={i}
                  className="absolute text-white"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 30}deg) translateY(-140px)`,
                  }}
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="w-48 h-48 bg-secondary text-white rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(172,53,9,0.5)] border-8 border-white"
            >
              <Trophy size={80} strokeWidth={2.5} />
            </motion.div>
          </div>

          <h1 className="text-4xl font-black tracking-tighter leading-none mb-4 italic uppercase text-primary-container">
            Overall Champion
          </h1>
          <div className="h-1 w-32 bg-white mb-8"></div>

          <h2 className="text-6xl font-black mb-6 tracking-tight text-white drop-shadow-lg">
            {OVERALL_CHAMPION.name}
          </h2>

          <div className="grid grid-cols-2 gap-12 mb-12 text-left bg-black/20 p-8 rounded-2xl border border-white/10 backdrop-blur-sm w-full max-w-md">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container flex items-center gap-1 mb-1">
                <CheckCircle2 size={12}/> TOTAL CORRECT
              </p>
              <p className="text-4xl font-black font-mono tracking-tighter text-white">
                {OVERALL_CHAMPION.totalCorrect}
              </p>
            </div>
            <div className="border-l border-white/20 pl-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container flex items-center gap-1 mb-1">
                <Timer size={12}/> TOTAL TIME
              </p>
              <p className="text-4xl font-black font-mono tracking-tighter text-white">
                {(OVERALL_CHAMPION.totalTimeMs / 1000).toFixed(2)}s
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Full Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 bg-white rounded-3xl p-8 text-gray-900 shadow-2xl"
        >
          <h3 className="text-2xl font-black mb-6 uppercase tracking-widest text-primary border-b border-gray-100 pb-4">
            Final Standings
          </h3>

          <div className="flex flex-col gap-4">
            {FULL_LEADERBOARD.map((team, idx) => (
              <div 
                key={team.rank} 
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  team.rank === 1 ? "bg-secondary/10 border-secondary border-2" : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                    team.rank === 1 ? "bg-secondary text-white shadow-lg" : 
                    team.rank <= 3 ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-600"
                  }`}>
                    {team.rank === 1 ? <Trophy size={16}/> : team.rank <= 3 ? <Medal size={16}/> : team.rank}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-none mb-1">{team.name}</h4>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={12}/> {team.correctCount} CORRECT
                    </span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Time</p>
                   <p className="font-mono font-black text-lg">{(team.totalTimeMs / 1000).toFixed(2)}s</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex-1 bg-gray-100 text-gray-600 font-black py-4 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2 text-sm"
            >
              Exit to Admin <ArrowRight size={16} />
            </button>
            <button className="flex-1 bg-primary text-white font-black py-4 rounded-xl hover:bg-primary/90 transition-all uppercase tracking-widest text-sm shadow-lg">
              Export CSV
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
