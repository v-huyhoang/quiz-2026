import { useCallback, useEffect, useState } from "react";
import { Trophy, Loader2, Timer, CheckCircle2, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { getPublicRoundResults, getGameResult, type RoundResult, type RoundResultEntry } from "../../services/gameService";
import { useGameSocket } from "../../hooks/useGameSocket";
import backgroundImage from "../../assets/background.png";
import waveImage from "../../assets/wave.png";
import logoImage from "../../assets/logo.png";
import medal1 from "../../assets/medal_1.png";
import medal2 from "../../assets/medal_2.png";
import medal3 from "../../assets/medal_3.png";
import "../../assets/css/stage-final.css"

const RANK_CONFIG = [
  {
    icon: "🥇",
    label: "👑 VUA KIẾN THỨC",
    border: "border-yellow-500",
    bg: "from-yellow-300/70 to-amber-400/50",
    glow: "shadow-[0_0_20px_rgba(255,215,0,0.6),0_0_50px_rgba(255,215,0,0.4),0_0_80px_rgba(255,215,0,0.25)]",
  },
  {
    icon: "🥈",
    label: "⚔️ CHIẾN BINH TRI THỨC",
    border: "border-sky-400/70",
    bg: "from-slate-200/40 to-slate-300/20",
    glow: "",
  },
  {
    icon: "🥉",
    label: "🔥 NGÔI SAO TRIỂN VỌNG",
    border: "border-orange-300/40",
    bg: "from-orange-300/40 to-orange-400/20",
    glow: "",
  },
  {
    icon: "🏅",
    label: "💡 Tư duy sắc bén",
    border: "border-amber-300",
    bg: "from-amber-200/60 to-amber-100/40",
    glow: "shadow-[0_8px_30px_rgba(250,184,28,0.14)]",
    titleColor: "text-slate-900",
    labelColor: "text-amber-700",
  },
  {
    icon: "🎖️",
    label: "📚 Học giả tiềm năng",
    border: "border-amber-200",
    bg: "from-amber-50/60 to-amber-50/30",
    glow: "shadow-[0_6px_24px_rgba(250,184,28,0.08)]",
    titleColor: "text-slate-900",
    labelColor: "text-amber-700",
  },
];

function RankingRow({ entry, rank, variant = "round", }: {
  entry: RoundResultEntry;
  rank: number;
  variant?: "final" | "round";
}) {
  const defaultConfig = {
    icon: "🏅",
    label: `TOP ${rank + 1}`,
    border: "border-gray-300",
    bg: "from-white/10 to-white/5",
    glow: "",
  };

  const config = RANK_CONFIG[rank] ?? defaultConfig;

  const isFinal = variant === "final";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        relative overflow-hidden
        rounded-2xl
        border
        ${config.border}
        bg-gradient-to-r
        ${config.bg}
        ${config.glow}
        ${isFinal ? 'px-8 py-6' : 'px-6 py-5'}
      `}
    >
      {rank === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="champion-halo" />
        </div>
      )}
      {rank === 0 && (
        <div className="champion-shimmer" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`${isFinal ? 'text-6xl mr-4' : 'text-5xl'}`}>
            {config.icon}
          </div>

          <div>
            <p className={`${isFinal ? 'text-2xl' : 'text-xl'} font-black ${config.titleColor ?? 'text-slate-900'}`}>
              {entry.team_name}
            </p>

            <p className={`text-xs ${config.labelColor ?? 'text-slate-500'} font-bold uppercase tracking-tight`}>
              {config.label}
            </p>
          </div>
        </div>

        <div className={`flex items-center ${isFinal ? 'gap-10' : 'gap-8'}`}>
          <div className="text-center">
            <p className={`text-emerald-700 font-extrabold ${isFinal ? 'text-3xl' : 'text-2xl'}`}>
              {entry.correct_count}
            </p>
            <p className="text-xs text-slate-700 font-semibold uppercase tracking-wide">
              Câu đúng
            </p>
          </div>

          <div className={`text-center min-w-[${isFinal ? 90 : 70}px]`}>
            <p className={`${isFinal ? 'text-2xl' : 'text-xl'} text-slate-900 font-black`}>
              {entry.total_time_seconds}s
            </p>
            <p className="text-sm text-slate-700 font-semibold uppercase tracking-wide">
              Thời gian
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RoundSection({ round, index, }: {
  round: RoundResult;
  index: number;
}) {
  const top3 = round.top_teams.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.4,
      }}
      className="rounded-3xl bg-white/45 border-2 border-white/50 shadow-2xl p-8 min-h-[320px]"
      style={{
        background: 'linear-gradient(180deg, #ffffff0a, #ffffff05)',
        boxShadow: '0 0 20px #25202453, 0 0 30px #14f6ff33',
        border: '1px solid #0054a6',
        backgroundClip: 'padding-box',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy
            size={26}
            className="text-yellow-400"
          />

          <h3 className="text-3xl font-black uppercase text-sky-900">
            Vòng {round.round_number}
          </h3>
        </div>

        <div className="px-4 py-2 rounded-full bg-yellow-400">
          <span className="text-sm font-black uppercase text-slate-900">
            TOP 3
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {top3.map((entry, rank) => (
          <RankingRow
            key={entry.team_id}
            entry={entry}
            rank={rank}
            variant="round"
          />
        ))}
      </div>
    </motion.div>
  );
}

function PodiumCard({ entry, delay, pos, }: {
  entry: RoundResultEntry;
  delay: number;
  pos: 1 | 2 | 3;
}) {
  const isChampion = pos === 1;
  const isSecond = pos === 2;
  const cardSize = isChampion ? "podium-card champion-card" : "podium-card";
  const ribbonText = {
    1: "👑 VUA KIẾN THỨC",
    2: "⚔️ CHIẾN BINH TRI THỨC",
    3: "🔥 NGÔI SAO TRIỂN VỌNG",
  }[pos];

  return (
    <motion.div
      initial={pos === 1 ? { opacity: 0, y: -30, scale: 0.8 } : pos === 2 ? { opacity: 0, y: 20, rotate: -10 } : { opacity: 0, y: 40 }}
      animate={pos === 1 ? { opacity: 1, y: 0, scale: 1.3, transition: { type: "spring", stiffness: 250, damping: 20, delay: 6 } } : pos === 2 ? { opacity: 1, scale: 1.1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 20, delay: 4 } } : { opacity: 1, y: 0, transition: { delay: 2 } }}
      transition={{ delay }}
      className={`relative overflow-visible flex flex-col items-center gap-4 ${cardSize} rounded-[32px] bg-white/95 backdrop-blur-xl border shadow-2xl`}
      style={{ borderColor: isChampion ? '#EAB308' : '#9CA3AF' }}
    >
      <div
        className={`podium-ribbon ${isChampion
          ? "champion"
          : isSecond
            ? "second"
            : "third"
          }`}
      >
        <motion.span
          className="order-text"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {ribbonText}
        </motion.span>
      </div>

      <motion.div
        className="avatar-medal-wrapper"
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={pos === 1 ? medal1 : pos === 2 ? medal2 : medal3}
          alt={`medal-${pos}`}
          className="avatar-medal-img"
        />
      </motion.div>

      {/* Team */}
      <p className={`font-black text-slate-900 text-center ${isChampion ? 'text-4xl' : 'text-3xl'} text-center`} title={entry.team_name}>
        {entry.team_name.length > (isChampion ? 12 : 10) ? `${entry.team_name.slice(0, isChampion ? 12 : 10)}…` : entry.team_name}
      </p>

      {/* Stats */}
      <div className="podium-stats">
        <div className="stat-row">
          <span className="stat-icon-wrapper check">
            <CheckCircle2 size={16} />
          </span>
          <span className="stat-value">
            {entry.correct_count} câu đúng
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-icon-wrapper time">
            {isChampion ? <Zap size={16} /> : <Timer size={16} />}
          </span>
          <span className="stat-value">
            {entry.total_time_seconds} giây
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const banTumLumTuaLua = () => {
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
}

function GameFinal({ round, index }: { round: RoundResult; index: number }) {
  const top3 = round.top_teams.slice(0, 3);

  useEffect(() => {
    setTimeout(() => {
      banTumLumTuaLua();
    }, 6100);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className="final-result-board"
      style={{
        background: 'linear-gradient(180deg, #ffffff0a, #ffffff05)',
        boxShadow: '0 0 20px #25202453, 0 0 30px #14f6ff33',
        border: '1px solid #0054a6',
        backgroundClip: 'padding-box',
      }}
    >
      {top3.length === 0 ? (
        <p className="text-center text-white text-sm py-4">Chưa có kết quả</p>
      ) : (
        <div className="honor-layout">
          {/* TOP 2 */}
          <div className="podium-column podium-second">
            <PodiumCard
              entry={top3[1]}
              delay={5}
              pos={2}
            />
          </div>

          {/* TOP 1 */}
          <div className="podium-column podium-first">
            <PodiumCard
              entry={top3[0]}
              delay={0}
              pos={1}
            />
          </div>

          {/* TOP 3 */}
          <div className="podium-column podium-third">
            <PodiumCard
              entry={top3[2]}
              delay={10}
              pos={3}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function StageFinal() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");

  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(() => !!gameId);
  const [totalTop, setTotalTop] = useState<RoundResultEntry[] | null>(null);
  const [_, setPublished] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    // By default show per-round results. When admin publishes, a socket event will trigger total leaderboard.
    getPublicRoundResults(gameId)
      .then((r) => setRounds(r.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gameId]);

  // Subscribe to results published event to switch to total leaderboard
  useGameSocket(gameId ? Number(gameId) : null, {
    ".results.published": async () => {
      if (!gameId) return;
      setPublished(true);
      setLoading(true);
      try {
        const res = await getGameResult(gameId);
        setTotalTop(res.data.data?.top_teams ?? []);
        setRounds([]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
  });

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

      <img
        src={waveImage}
        alt="waveImage"
        className="absolute w-1/3 h-1/3 bottom-0 right-0 opacity-40 pointer-events-none select-none z-0"
      />

      <div className="absolute top-4 right-8 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-sm z-10">
        <img
          src={logoImage}
          alt="Logo"
          className="h-28 w-auto object-contain"
        />
      </div>

      <div className="relative z-10 w-full h-screen px-10 pt-4 pb-6 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2 shrink-0"
        >
          <div className="inline-flex items-center gap-3 bg-gray-200 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-4">
            <Trophy size={20} className="text-amber-400 font-extrabold" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-black/50">Kết quả thi đấu</span>
          </div>
          <h1 className="flex items-center justify-center gap-4 drop-shadow-lg">
            <span className="text-4xl xl:text-5xl font-black uppercase text-white">
              VINH DANH
            </span>
            <span className="h-14 px-6 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 text-4xl font-black">
              TOP 3
            </span>
          </h1>
          <p className="text-black/50 text-md font-bold uppercase tracking-widest">
            Những đội trả lời nhanh nhất và chính xác nhất
          </p>
        </motion.div>

        {/* Content */}
        <AnimatePresence>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-white/40" size={40} />
            </div>
          ) : totalTop && totalTop.length > 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-[1400px] w-full space-y-6">
                {/* Use GameFinal component to render podium from aggregated results */}
                <GameFinal
                  round={{ round_number: 0, top_teams: totalTop }}
                  index={0}
                />
              </div>
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-24 text-white/40">
              <Trophy size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-widest">Không có dữ liệu kết quả</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-wrap justify-center gap-6 max-w-[1800px]">
                {rounds.map((round, i) => (
                  <div key={round.round_number} className="w-[560px]" >
                    <RoundSection round={round} index={i} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
