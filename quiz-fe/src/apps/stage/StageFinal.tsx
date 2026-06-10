import { useEffect, useState } from "react";
import { Trophy, Loader2, Timer, CheckCircle2, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { getPublicGameState, getPublicRoundResults, getGameResult, type RoundResult, type RoundResultEntry } from "../../services/gameService";
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
  entry?: RoundResultEntry;
  delay: number;
  pos: 1 | 2 | 3;
}) {
  if (!entry) return null;
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
      animate={pos === 1 ? { opacity: 1, y: 0, scale: 1.3, transition: { type: "spring", stiffness: 140, damping: 24, delay } } : pos === 2 ? { opacity: 1, scale: 1.1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 150, damping: 22, delay: 5.5 } } : { opacity: 1, y: 0, transition: { delay: 3, duration: 0.8 } }}
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

const FIREWORK_COLORS = [
  '#FFD700', '#FFC200', '#FF6B35',
  '#FF4060', '#FF1493',
  '#00E5FF', '#4488FF',
  '#FFFFFF', '#F8F0FF',
  '#ADFF2F', '#00FF87',
];

// Small side burst when a rank card appears
const smallBurst = (fromLeft: boolean) => confetti({
  particleCount: 45,
  angle: fromLeft ? 65 : 115,
  spread: 48,
  origin: { x: fromLeft ? 0.04 : 0.96, y: 0.85 },
  colors: FIREWORK_COLORS,
  shapes: ['star', 'circle'],
  scalar: 1.1,
  ticks: 170,
  startVelocity: 52,
  gravity: 0.82,
  decay: 0.93,
  zIndex: 9999,
});

// Champion celebration bursts when top 1 is revealed
const championBurst = () => {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  confetti({ particleCount: 80, angle: 65, spread: 52, origin: { x: 0.05, y: 0.95 }, colors: FIREWORK_COLORS, shapes: ['star'], scalar: 1.4, ticks: 240, startVelocity: 68, gravity: 0.82, decay: 0.93, zIndex: 9999 });
  confetti({ particleCount: 80, angle: 115, spread: 52, origin: { x: 0.95, y: 0.95 }, colors: FIREWORK_COLORS, shapes: ['star'], scalar: 1.4, ticks: 240, startVelocity: 68, gravity: 0.82, decay: 0.93, zIndex: 9999 });
  confetti({ particleCount: 110, spread: 360, origin: { x: rand(0.35, 0.65), y: rand(0.2, 0.38) }, colors: FIREWORK_COLORS, shapes: ['star', 'circle'], scalar: rand(1.2, 1.7), ticks: 280, startVelocity: 24, gravity: 0.55, decay: 0.91, zIndex: 9999 });
};

// Massive particle explosion for champion reveal
const massiveChampionReveal = () => {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  // Central supernova
  confetti({ particleCount: 220, spread: 360, origin: { x: 0.5, y: 0.42 }, colors: FIREWORK_COLORS, shapes: ['star', 'circle'], scalar: rand(1.3, 1.9), ticks: 340, startVelocity: 38, gravity: 0.52, decay: 0.9, zIndex: 9999 });
  // 4 corner cannons
  setTimeout(() => confetti({ particleCount: 90, angle: 55, spread: 55, origin: { x: 0, y: 1 }, colors: FIREWORK_COLORS, shapes: ['star'], scalar: 1.5, ticks: 260, startVelocity: 78, gravity: 0.8, decay: 0.92, zIndex: 9999 }), 120);
  setTimeout(() => confetti({ particleCount: 90, angle: 125, spread: 55, origin: { x: 1, y: 1 }, colors: FIREWORK_COLORS, shapes: ['star'], scalar: 1.5, ticks: 260, startVelocity: 78, gravity: 0.8, decay: 0.92, zIndex: 9999 }), 120);
  setTimeout(() => confetti({ particleCount: 70, angle: -50, spread: 50, origin: { x: 0, y: 0 }, colors: FIREWORK_COLORS, shapes: ['circle'], scalar: 1.2, ticks: 220, startVelocity: 60, gravity: 0.9, decay: 0.91, zIndex: 9999 }), 250);
  setTimeout(() => confetti({ particleCount: 70, angle: -130, spread: 50, origin: { x: 1, y: 0 }, colors: FIREWORK_COLORS, shapes: ['circle'], scalar: 1.2, ticks: 220, startVelocity: 60, gravity: 0.9, decay: 0.91, zIndex: 9999 }), 250);
  // Mid-air rockets
  setTimeout(() => confetti({ particleCount: 130, spread: 360, origin: { x: rand(0.3, 0.7), y: rand(0.15, 0.35) }, colors: FIREWORK_COLORS, shapes: ['star'], scalar: rand(1.4, 2.0), ticks: 300, startVelocity: 20, gravity: 0.45, decay: 0.89, zIndex: 9999 }), 400);
  setTimeout(() => confetti({ particleCount: 100, spread: 360, origin: { x: rand(0.2, 0.5), y: rand(0.2, 0.4) }, colors: FIREWORK_COLORS, shapes: ['star', 'circle'], scalar: rand(1.2, 1.7), ticks: 280, startVelocity: 18, gravity: 0.5, decay: 0.9, zIndex: 9999 }), 580);
  setTimeout(() => confetti({ particleCount: 100, spread: 360, origin: { x: rand(0.5, 0.8), y: rand(0.2, 0.4) }, colors: FIREWORK_COLORS, shapes: ['star', 'circle'], scalar: rand(1.2, 1.7), ticks: 280, startVelocity: 18, gravity: 0.5, decay: 0.9, zIndex: 9999 }), 700);
};

function GlowRays({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="glow-rays"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9996, pointerEvents: 'none', overflow: 'hidden' }}
        >
          {/* Rotating rays */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', width: 3, height: '120vh',
                background: `linear-gradient(to bottom, transparent 0%, rgba(255,215,0,${0.06 + (i % 3) * 0.04}) 40%, transparent 100%)`,
                transformOrigin: 'center center',
                transform: `rotate(${i * 20}deg)`,
              }} />
            ))}
          </motion.div>
          {/* Pulsing radial glow */}
          <motion.div
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.12, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 48%, rgba(255,215,0,0.18) 0%, rgba(255,140,0,0.08) 38%, transparent 68%)' }}
          />
          {/* Expanding rings */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i}
              initial={{ scale: 0.1, opacity: 0.6 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.55, ease: 'easeOut' }}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 240, height: 240, borderRadius: '50%', border: '1.5px solid rgba(255,215,0,0.45)' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScreenFlash({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="screen-flash"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, rgba(255,230,100,0.72) 0%, rgba(255,180,0,0.45) 30%, transparent 65%)' }}
        />
      )}
    </AnimatePresence>
  );
}

function ChampionBanner() {
  return (
    // Outer: only opacity — no scale, so fixed overlay covers full screen
    <motion.div
      key="champion-banner-outer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
        background: 'rgba(2, 0, 18, 0.68)',
        backdropFilter: 'blur(3px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Inner: scale animation on the content only */}
      <motion.div
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.18, opacity: 0 }}
        transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        {/* Pulse rings */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.2, opacity: 0.7 }}
            animate={{ scale: 4.5, opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 180, height: 180, borderRadius: '50%', border: '1.5px solid rgba(255,215,0,0.5)', pointerEvents: 'none' }}
          />
        ))}
        <div style={{ fontSize: 'clamp(52px, 6.5vw, 110px)', lineHeight: 1, marginBottom: 6 }}>🏆</div>
        <div
          style={{
            fontSize: 'clamp(60px, 9.5vw, 168px)',
            fontWeight: 900,
            fontFamily: "'Arial Black', Arial, sans-serif",
            background: 'linear-gradient(175deg, #FFF5A0 0%, #FFD700 32%, #FFA800 62%, #FFD700 88%, #FFF5A0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 36px rgba(255,215,0,0.95)) drop-shadow(0 0 70px rgba(255,140,0,0.65))',
            letterSpacing: '0.1em',
            lineHeight: 1.05,
            textTransform: 'uppercase',
          }}
        >
          CHAMPION
        </div>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(12px, 1.6vw, 24px)', fontWeight: 700, letterSpacing: '0.42em', textTransform: 'uppercase', marginTop: 14 }}
        >
          Vinh danh quán quân xuất sắc nhất
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function GameFinal({ round, index, championRevealed }: {
  round: RoundResult;
  index: number;
  championRevealed: boolean;
}) {
  const top3 = round.top_teams.slice(0, 3);
  const [showBanner, setShowBanner] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Timers for top 3 & top 2 on mount
  useEffect(() => {
    const timers = [
      setTimeout(() => { smallBurst(true); smallBurst(false); }, 3900),
      setTimeout(() => { smallBurst(true); smallBurst(false); }, 6400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Champion sequence fires when admin triggers reveal
  useEffect(() => {
    if (!championRevealed) return;
    const timers = [
      setTimeout(() => { setShowBanner(true); setShowGlow(true); }, 100),
      setTimeout(() => setShowBanner(false), 1400),
      setTimeout(() => setShowFlash(true), 1550),
      setTimeout(() => setShowFlash(false), 2150),
      setTimeout(() => massiveChampionReveal(), 1700),
      setTimeout(() => championBurst(), 2600),
      setTimeout(() => championBurst(), 3300),
      setTimeout(() => setShowGlow(false), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [championRevealed]);

  return (
    <>
      <GlowRays visible={showGlow} />
      <ScreenFlash visible={showFlash} />
      <AnimatePresence>
        {showBanner && <ChampionBanner key="champion-banner" />}
      </AnimatePresence>
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
            {top3[1] && (
              <div className="podium-column podium-second">
                <PodiumCard entry={top3[1]} delay={5} pos={2} />
              </div>
            )}

            {/* TOP 1 — only renders after champion.revealed */}
            {top3[0] && (
              <div className="podium-column podium-first">
                {championRevealed
                  ? <PodiumCard entry={top3[0]} delay={1.4} pos={1} />
                  : <div style={{ width: 290, minHeight: 390 }} />}
              </div>
            )}

            {/* TOP 3 */}
            {top3[2] && (
              <div className="podium-column podium-third">
                <PodiumCard entry={top3[2]} delay={10} pos={3} />
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}

export default function StageFinal() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");

  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(() => !!gameId);
  const [totalTop, setTotalTop] = useState<RoundResultEntry[] | null>(null);
  const [_, setPublished] = useState(false);
  const [championRevealed, setChampionRevealed] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    getPublicGameState(Number(gameId))
      .then(async (res) => {
        const state = res.data.data;
        if (state.status === "finished" && state.results_published) {
          setPublished(true);
          if (state.champion_revealed) {
            setChampionRevealed(true);
          }
          const resultRes = await getGameResult(gameId);
          setTotalTop(resultRes.data.data?.top_teams ?? []);
          setRounds([]);
        } else {
          const roundsRes = await getPublicRoundResults(gameId);
          setRounds(roundsRes.data.data ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gameId]);

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
    ".champion.revealed": () => {
      setChampionRevealed(true);
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
          <AnimatePresence mode="wait">
            {totalTop && totalTop.length > 0 ? (
              <motion.div
                key="vinh-danh"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="flex items-center justify-center gap-4 drop-shadow-lg">
                  <span className="text-4xl xl:text-5xl font-black uppercase text-white">VINH DANH</span>
                  <span className="h-14 px-6 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 text-4xl font-black">TOP 3</span>
                </h1>
                <p className="text-black/50 text-md font-bold uppercase tracking-widest">
                  Những đội trả lời nhanh nhất và chính xác nhất
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="bang-xep-hang"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="flex items-center justify-center gap-4 drop-shadow-lg">
                  <span className="text-4xl xl:text-5xl font-black uppercase text-white">BẢNG XẾP HẠNG</span>
                </h1>
                <p className="text-black/50 text-md font-bold uppercase tracking-widest">
                  Kết quả từng vòng thi đấu
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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
                  championRevealed={championRevealed}
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
