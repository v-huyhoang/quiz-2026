import { useEffect, useState } from "react";
import { Trophy, Medal, Timer, CheckCircle2, Loader2, Star } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { getPublicRoundResults, type RoundResult, type RoundResultEntry } from "../../services/gameService";
import backgroundImage from "../../assets/background.png";

const MEDAL_CONFIG = [
  {
    label: "1ST",
    bg: "from-amber-400 to-yellow-300",
    border: "border-amber-300",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.6)]",
    badge: "bg-amber-400 text-white",
    ring: "ring-4 ring-amber-300/50",
    size: "scale-125 -translate-y-10",
    icon: <Trophy size={22} />,
  },
  {
    label: "2ND",
    bg: "from-slate-400 to-gray-300",
    border: "border-slate-300",
    glow: "shadow-[0_0_30px_rgba(148,163,184,0.5)]",
    badge: "bg-slate-400 text-white",
    ring: "ring-4 ring-slate-300/40",
    size: "",
    icon: <Medal size={22} />,
  },
  {
    label: "3RD",
    bg: "from-orange-500 to-amber-400",
    border: "border-orange-400",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.5)]",
    badge: "bg-orange-500 text-white",
    ring: "ring-4 ring-orange-400/40",
    size: "",
    icon: <Medal size={22} />,
  },
];

function PodiumCard({ entry, config, delay, isWinner }: { entry: RoundResultEntry; config: typeof MEDAL_CONFIG[0]; delay: number; isWinner?: boolean }) {
  useEffect(() => {
    if (!isWinner) return;
    // small confetti burst focused when winner card mounts
    confetti({ particleCount: 40, spread: 60, startVelocity: 40 });
  }, [isWinner]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={isWinner ? { opacity: 1, y: 0, scale: [1, 1.06, 1] } : { opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut", repeat: isWinner ? Infinity : 0, repeatDelay: isWinner ? 1.6 : 0 }}
      className={`relative flex flex-col items-center gap-4 px-8 py-8 min-w-[140px] rounded-3xl bg-white/10 backdrop-blur-md border ${config.border} ${config.glow} ${config.ring} ${config.size} transition-transform overflow-visible`}
    >
      {/* Winner halo */}
      {isWinner && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="absolute -inset-4 -z-10 flex items-center justify-center"
        >
          <div className="w-[220px] h-[220px] rounded-full bg-gradient-to-r from-amber-400/12 via-amber-300/8 to-transparent blur-3xl" />
        </motion.div>
      )}

      {/* Medal badge */}
      <div className={`w-14 h-14 rounded-full ${config.badge} flex items-center justify-center font-black shadow-lg`}>
        {config.icon}
      </div>

      {/* Avatar circle */}
      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${config.bg} flex items-center justify-center text-white text-4xl font-black shadow-lg relative`}> 
        {isWinner && (
          <span className="absolute -top-3 text-2xl">👑</span>
        )}
        {entry.team_name.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <p className="text-white font-black text-2xl text-center leading-tight max-w-[120px] break-words">
        {entry.team_name}
      </p>

      {/* Stats */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 text-lg font-bold text-green-300">
          <CheckCircle2 size={18} />
          <span>{entry.correct_count} đúng</span>
        </div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <Timer size={18} />
          <span>{entry.total_time_seconds}s</span>
        </div>
      </div>
    </motion.div>
  );
}

function RoundSection({ round, index }: { round: RoundResult; index: number }) {
  const top3 = round.top_teams.slice(0, 3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const configOrder = [MEDAL_CONFIG[1], MEDAL_CONFIG[0], MEDAL_CONFIG[2]];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className="h-full bg-primary-container backdrop-blur-sm border border-white/10 rounded-3xl p-6 flex flex-col"
    >
      {/* Round header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/40 flex items-center justify-center">
          <Star size={28} className="text-amber-400 fill-amber-400 font-extrabold" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest">VÒNG THI {round.round_number}</h3>
        </div>
        <div className="ml-auto px-4 py-1.5 bg-primary-container/20 border border-primary-container/30 rounded-full">
          <p className="text-base font-black text-primary uppercase tracking-widest">Top 3 vinh danh</p>
        </div>
      </div>

      {top3.length === 0 ? (
        <p className="text-center text-white text-sm py-4">Chưa có kết quả</p>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-10">
          {podiumOrder.map((entry, i) => {
            if (!entry) return null;
            return (
              <PodiumCard
                key={entry.team_id}
                entry={entry}
                config={configOrder[i]}
                delay={index * 0.15 + i * 0.1 + 0.2}
                isWinner={i === 1}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function StageFinal() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");

  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) { setLoading(false); return; }
    getPublicRoundResults(gameId)
      .then((res) => setRounds(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gameId]);

  useEffect(() => {
    if (loading || rounds.length === 0) return;
    const duration = 6 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const count = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount: count, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount: count, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [loading, rounds.length]);

  return (
    <div className="min-h-screen text-white relative overflow-y-auto"
      style={{
        backgroundImage: `
          url(${backgroundImage})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}>
      {/* Background layers */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/15 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 w-full h-screen px-10 py-8 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 shrink-0"
        >
          <div className="inline-flex items-center gap-3 bg-gray-200 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6">
            <Trophy size={20} className="text-amber-400 font-extrabold" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-black/50">Kết quả thi đấu</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white drop-shadow-lg">
            Vinh danh
            <span className="text-primary-container"> Top 3</span>
          </h1>
          <p className="text-black/50 text-md mt-3 font-bold uppercase tracking-widest">
            Những người trả lời nhanh nhất và chính xác nhất
          </p>
        </motion.div>

        {/* Content */}
        <AnimatePresence>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-white/40" size={40} />
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-24 text-white/40">
              <Trophy size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-widest">Không có dữ liệu kết quả</p>
            </div>
          ) : (
            <div className="flex-1 flex gap-6 min-h-0">
              {rounds.map((round, i) => (
                <div key={round.round_number} className="flex-1">
                  <RoundSection round={round} index={i} />
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
