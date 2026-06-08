import { useCallback, memo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, Layers, HelpCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { getPublicGameState, type GameTeam, type GameState } from "../../services/gameService";
import { getRoomByCode } from "../../services/roomService";
import backgroundImage from "../../assets/background.png";
import waveImage from "../../assets/wave.png";
import logoImage from "../../assets/logo.png";
import { GridBg } from "../../components/ui/GridBg";
import { useGameSocket } from "../../hooks/useGameSocket";

const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

type GameInfo = Pick<GameState, "name" | "access_code" | "rounds_total" | "questions_per_round" | "max_teams">;

export default function StageWaitting() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = searchParams.get("room") ?? "";

  const [gameId, setGameId]         = useState<number | null>(null);
  const [gameInfo, setGameInfo]     = useState<GameInfo | null>(null);
  const [teams, setTeams]           = useState<GameTeam[]>([]);
  const [lastJoined, setLastJoined] = useState<string | null>(null);
  const [lastLeft, setLastLeft]     = useState<string | null>(null);
  const [phase, setPhase]           = useState<'splash' | 'intro' | 'waiting'>('splash');
  const [revealReady, setRevealReady] = useState(false);
  const qrAreaRef = useRef<HTMLDivElement>(null);

  // Transition splash → intro once WS reveal arrives AND joinUrl is ready
  useEffect(() => {
    if (revealReady && joinUrl && phase === 'splash') setPhase('intro');
  });

  // ── Fetch room by code then load initial game state ────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    getRoomByCode(roomCode)
      .then((room) => {
        setGameId(room.id);
        return getPublicGameState(room.id);
      })
      .then((res) => {
        const d = res.data.data;
        setTeams(d.teams);
        setGameInfo({
          name: d.name,
          access_code: d.access_code,
          rounds_total: d.rounds_total,
          questions_per_round: d.questions_per_round,
          max_teams: d.max_teams ?? 30,
        });
      })
      .catch(() => {});
  }, [roomCode]);

  const clearJoined = useCallback(() => setLastJoined(null), []);
  const clearLeft   = useCallback(() => setLastLeft(null), []);

  // ── WebSocket subscription ─────────────────────────────────────────────────
  useGameSocket(gameId, {
    ".team.joined": (data: { team: GameTeam }) => {
      setTeams((prev) =>
        prev.some((t) => t.id === data.team.id) ? prev : [...prev, data.team]
      );
      setLastJoined(data.team.name);
      setLastLeft(null);
    },
    ".team.left": (data: { team: GameTeam }) => {
      setTeams((prev) => prev.filter((t) => t.id !== data.team.id));
      setLastLeft(data.team.name);
      setLastJoined(null);
    },
    ".screen.revealed": () => {
      setRevealReady(true);
    },
    ".game.started": () => {
      navigate(`/stage/question?gameId=${gameId}`, { replace: true });
    },
    ".question.started": () => {
      navigate(`/stage/question?gameId=${gameId}`, { replace: true });
    },
    ".game.finished": () => {
      navigate(`/stage/final?gameId=${gameId}`, { replace: true });
    },
  });

  const joinUrl    = gameInfo ? `${APP_URL}/join?room=${gameInfo.access_code}` : "";
  const maxTeams   = gameInfo?.max_teams ?? 30;
  const emptySlots = Math.max(0, maxTeams - teams.length);

  return (
    <>
      {/* ── SPLASH: only background + centered logo ──────────────────────── */}
      {phase === 'splash' && (
        <div
          className="min-h-screen flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <img src={logoImage} alt="Logo" className="h-52 w-auto object-contain drop-shadow-2xl select-none" />
        </div>
      )}

      {/* ── INTRO + WAITING: full waiting room UI ────────────────────────── */}
      {phase !== 'splash' && (
      <div
        className="min-h-screen bg-surface flex flex-col relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Logo — top right */}
        <img
          src={logoImage}
          alt="Logo"
          className="absolute top-4 right-6 h-24 w-auto object-contain z-10 pointer-events-none select-none"
        />

        {/* Content: flex row, fills remaining height */}
        <div className="flex-1 flex min-h-0 relative">
          <img
            src={waveImage}
            alt="waveImage"
            className="absolute w-1/3 h-1/3 bottom-0 right-0 opacity-40 pointer-events-none select-none z-0"
          />

          {/* ── Left: scrollable content ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-12 py-10 flex flex-col gap-8 min-w-0">
            {gameInfo && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Trò chơi</p>
                  <h1 className="text-5xl font-black text-gray-900 leading-tight truncate">{gameInfo.name}</h1>
                </div>
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Layers size={13} />
                    <span className="text-sm font-semibold">Số vòng:</span>
                    <span className="text-sm font-black text-gray-900">{gameInfo.rounds_total}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <HelpCircle size={13} />
                    <span className="text-sm font-semibold">Câu hỏi / vòng:</span>
                    <span className="text-sm font-black text-gray-900">{gameInfo.questions_per_round}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <HelpCircle size={13} />
                    <span className="text-sm font-semibold">Tổng:</span>
                    <span className="text-sm font-black text-gray-900">{gameInfo.rounds_total * gameInfo.questions_per_round} câu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-500">Mã phòng:</span>
                    <span className="text-sm font-black text-primary font-mono tracking-widest">{gameInfo.access_code}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Progress bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Đội đã tham gia</span>
                <span className="text-4xl font-black text-primary tabular-nums">
                  {teams.length}
                  <span className="text-xl text-gray-400 font-bold">/{maxTeams}</span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(teams.length / maxTeams) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>

            {/* Team grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {teams.map((team, index) => (
                <StageTeamCard key={team.id} team={team} index={index} />
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="border-2 border-dashed border-gray-400 bg-gray-50/40 p-3 rounded-xl flex items-center gap-3 opacity-40"
                >
                  <div className="w-10 h-10 rounded-full border border-gray-900 flex items-center justify-center text-gray-300 shrink-0">
                    <UserPlus className="text-gray-900" size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Trống</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: QR panel ───────────────────────────────────────────── */}
          <div className="w-[600px] shrink-0 flex flex-col items-center justify-center px-8 py-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-5 shadow-xl w-full"
              style={{ backgroundColor: '#ffffff' }}
            >
              <p className="text-[15px] font-black text-gray-400 uppercase tracking-[0.25em]">Quét để tham gia</p>

              <div className="relative rounded-xl" style={{ backgroundColor: '#ffffff', padding: '12px' }}>
                {/* Corner brackets */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === 'waiting' ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 pointer-events-none z-20"
                >
                  <div className="absolute top-2 left-2 w-7 h-7 border-t-[3px] border-l-[3px] border-primary rounded-tl-sm" />
                  <div className="absolute top-2 right-2 w-7 h-7 border-t-[3px] border-r-[3px] border-primary rounded-tr-sm" />
                  <div className="absolute bottom-2 left-2 w-7 h-7 border-b-[3px] border-l-[3px] border-primary rounded-bl-sm" />
                  <div className="absolute bottom-2 right-2 w-7 h-7 border-b-[3px] border-r-[3px] border-primary rounded-br-sm" />
                </motion.div>

                {/* Scan line — only after intro */}
                {phase === 'waiting' && (
                  <motion.div
                    className="absolute left-3 right-3 h-[2px] z-10 pointer-events-none rounded-full"
                    style={{ background: 'linear-gradient(90deg, transparent, #0ea5e9, #6366f1, #0ea5e9, transparent)', boxShadow: '0 0 10px 2px rgba(99,102,241,0.4)' }}
                    initial={{ top: '12px', opacity: 0 }}
                    animate={{ top: ['12px', '442px', '12px'], opacity: [0, 1, 1, 1, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  />
                )}

                {/* QR area — ref used by FullScreenIntro for particle assembly */}
                <div ref={qrAreaRef} style={{ display: 'inline-block' }}>
                  {joinUrl && phase === 'waiting' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <QRCodeSVG value={joinUrl} size={430} bgColor="#ffffff" fgColor="#1a1a2e" level="H" />
                    </motion.div>
                  )}
                  {/* Placeholder to hold space during loading / intro */}
                  {(!joinUrl || phase !== 'waiting') && (
                    <div style={{ width: 430, height: 430 }} />
                  )}
                </div>
              </div>

              {gameInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col items-center gap-1"
                >
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Mã phòng</p>
                  <p className="text-4xl font-extrabold text-primary font-mono tracking-widest">
                    {gameInfo.access_code}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Toast notifications */}
        <AnimatePresence>
          {lastJoined && (
            <JoinToast
              key={"join-" + lastJoined + teams.length}
              name={lastJoined}
              type="join"
              onDone={clearJoined}
            />
          )}
          {lastLeft && (
            <JoinToast
              key={"left-" + lastLeft + teams.length}
              name={lastLeft}
              type="leave"
              onDone={clearLeft}
            />
          )}
        </AnimatePresence>

        <GridBg opacity={0.03} />
      </div>
      )} {/* end phase !== 'splash' */}

      {/* One-time intro animation — plays during 'intro' phase */}
      {phase === 'intro' && joinUrl && (
        <FullScreenIntro
          url={joinUrl}
          qrSize={430}
          qrRef={qrAreaRef}
          onDone={() => setPhase('waiting')}
        />
      )}
    </>
  );
}

// ── FullScreenIntro ───────────────────────────────────────────────────────────

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

// Timeline (ms)
const T = {
  toHello:   { start: 400,  end: 1700 },
  holdHello: { start: 1700, end: 2700 },
  toScatter: { start: 2700, end: 3500 },
  toQr:      { start: 3500, end: 5600 },
  done:      5900,
};

type IParticle = {
  qox: number; qoy: number;
  hx: number;  hy: number;
  sx: number;  sy: number;
  qr: number;  qg: number; qb: number;
  cr: number;  cg: number; cb: number;
  sz: number;
};

const FullScreenIntro = memo(function FullScreenIntro({
  url, qrSize, qrRef, onDone,
}: {
  url: string;
  qrSize: number;
  qrRef: React.RefObject<HTMLDivElement | null>;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef   = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const rafRef    = useRef(0);
  const doneFired = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dark   = darkRef.current;
    if (!canvas || !dark) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width, H = canvas.height;

    // Wait briefly for QRCodeCanvas to render its pixels
    const initTimer = setTimeout(() => {
      // ── 1. Sample QR dark pixels ─────────────────────────────────────────
      const qrEl = hiddenRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
      if (!qrEl) return;
      const qCtx = qrEl.getContext('2d', { willReadFrequently: true });
      if (!qCtx) return;

      const cw = qrEl.width, ch = qrEl.height;
      const qImgData = qCtx.getImageData(0, 0, cw, ch).data;
      const qStep = 3;
      const scale  = qrSize / cw;

      const particles: IParticle[] = [];
      for (let y = 0; y < ch; y += qStep) {
        for (let x = 0; x < cw; x += qStep) {
          const i = (y * cw + x) * 4;
          if (qImgData[i + 3] < 128) continue;
          const qr = qImgData[i], qg = qImgData[i + 1], qb = qImgData[i + 2];
          if (qr > 230 && qg > 230 && qb > 230) continue; // skip white
          const hue = 185 + (x / cw) * 40; // cyan → sky blue
          const [cr, cg, cb] = hslToRgb(hue, 0.75, 0.58 + (y / ch) * 0.22);
          particles.push({
            qox: x * scale, qoy: y * scale,
            hx: 0, hy: 0,
            sx: Math.random() * W, sy: Math.random() * H,
            qr, qg, qb,
            cr, cg, cb,
            sz: Math.max(2, qStep * scale),
          });
        }
      }

      const hc = document.createElement('canvas');
      hc.width = W; hc.height = H;
      const hCtx = hc.getContext('2d')!;
      const fontSize = Math.min(W / 6.5, H * 0.22, 180);
      const lineGap  = fontSize * 0.25;
      hCtx.fillStyle = '#fff';
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'middle';
      hCtx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
      hCtx.fillText('THK Holdings', W / 2, H / 2 - fontSize / 2 - lineGap / 2);
      hCtx.font = `700 italic ${fontSize * 0.85}px 'Arial Black', Arial, sans-serif`;
      hCtx.fillText('VietNam', W / 2, H / 2 + fontSize / 2 + lineGap / 2);

      const hImgData = hCtx.getImageData(0, 0, W, H).data;
      const helloPos: [number, number][] = [];
      // Step sized so we get roughly the same count as QR particles
      const hStep = Math.max(2, Math.ceil(Math.sqrt((W * H * 0.1) / particles.length)));
      for (let y = 0; y < H; y += hStep) {
        for (let x = 0; x < W; x += hStep) {
          const i = (y * W + x) * 4;
          if (hImgData[i + 3] > 100) helloPos.push([x, y]);
        }
      }

      // Assign a HELLO target to each QR particle (cycle if needed)
      particles.forEach((p, i) => {
        const [hx, hy] = helloPos.length > 0
          ? helloPos[i % helloPos.length]
          : [W / 2, H / 2];
        p.hx = hx;
        p.hy = hy;
      });

      // ── 3. RAF animation loop ─────────────────────────────────────────────
      const ctx = canvas.getContext('2d')!;
      const t0  = performance.now();

      const loop = (now: number) => {
        const el = now - t0;

        // Fade out dark bg as scatter phase begins
        if (dark && el > T.toScatter.start) {
          const fadeT = Math.max(0, 1 - (el - T.toScatter.start) / (T.toScatter.end - T.toScatter.start));
          dark.style.opacity = String(fadeT);
        }

        if (!doneFired.current && el > T.done) {
          doneFired.current = true;
          cancelAnimationFrame(rafRef.current);
          onDone();
          return;
        }

        ctx.clearRect(0, 0, W, H);

        const qrRect = qrRef.current?.getBoundingClientRect();
        const qrLeft = qrRect?.left ?? 0;
        const qrTop  = qrRect?.top  ?? 0;

        for (const p of particles) {
          let x: number, y: number, r: number, g: number, b: number, sz: number;

          if (el < T.toHello.start) {
            // Initial scatter — particles at random positions
            x = p.sx; y = p.sy;
            r = p.cr; g = p.cg; b = p.cb;
            sz = p.sz * 3;
          } else if (el < T.toHello.end) {
            // Converge to spell HELLO
            const t = easeOutCubic((el - T.toHello.start) / (T.toHello.end - T.toHello.start));
            x = p.sx + (p.hx - p.sx) * t;
            y = p.sy + (p.hy - p.sy) * t;
            r = p.cr; g = p.cg; b = p.cb;
            sz = p.sz * (3 - 2 * t);
          } else if (el < T.holdHello.end) {
            // Hold HELLO
            x = p.hx; y = p.hy;
            r = p.cr; g = p.cg; b = p.cb;
            sz = p.sz;
          } else if (el < T.toScatter.end) {
            // Scatter from HELLO
            const t = easeOutCubic((el - T.toScatter.start) / (T.toScatter.end - T.toScatter.start));
            x = p.hx + (p.sx - p.hx) * t;
            y = p.hy + (p.sy - p.hy) * t;
            r = p.cr; g = p.cg; b = p.cb;
            sz = p.sz * (1 + t * 2.5);
          } else {
            // Converge to QR — slow and graceful
            const t = easeInOutCubic(Math.min(1, (el - T.toQr.start) / (T.toQr.end - T.toQr.start)));
            const qx = qrLeft + p.qox;
            const qy = qrTop  + p.qoy;
            x = p.sx + (qx - p.sx) * t;
            y = p.sy + (qy - p.sy) * t;
            r = Math.round(p.cr + (p.qr - p.cr) * t);
            g = Math.round(p.cg + (p.qg - p.cg) * t);
            b = Math.round(p.cb + (p.qb - p.cb) * t);
            sz = p.sz * (3 - 2 * t);
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, sz, sz);
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    }, 350);

    return () => {
      clearTimeout(initTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [url, qrSize, qrRef, onDone]);

  return (
    <>
      {/* Dark cinematic background */}
      <div
        ref={darkRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'linear-gradient(135deg, #06060f 0%, #0d0d2b 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Hidden QRCodeCanvas for pixel sampling */}
      <div
        ref={hiddenRef}
        style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none', opacity: 0 }}
      >
        <QRCodeCanvas value={url} size={qrSize} bgColor="#ffffff" fgColor="#1a1a2e" level="H" />
      </div>
      {/* Full-screen particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0,
          width: '100vw', height: '100vh',
          zIndex: 9999, pointerEvents: 'none',
        }}
      />
    </>
  );
});

// ── Pure sub-components ───────────────────────────────────────────────────────

const StageTeamCard = memo(function StageTeamCard({ team, index }: { team: GameTeam; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.04 }}
      className="bg-white border-2 border-primary/25 p-3 rounded-xl flex items-center gap-3 shadow-sm"
    >
      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-black text-base">
        {team.name.charAt(0).toUpperCase()}
      </div>
      <p className="text-xs font-black text-gray-900 truncate uppercase tracking-wide flex-1">{team.name}</p>
    </motion.div>
  );
});

function JoinToast({
  name,
  type,
  onDone,
}: {
  name: string;
  type: "join" | "leave";
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => setTimeout(onDone, 2500)}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-white shadow-lg px-5 py-3 rounded-2xl ${
        type === "join" ? "border border-primary/20" : "border border-orange-200"
      }`}
    >
      {type === "join" ? (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
      ) : (
        <LogOut size={14} className="text-orange-500 shrink-0" />
      )}
      <span className="text-sm font-bold text-gray-700">
        <span className={`font-black uppercase truncate ${type === "join" ? "text-primary" : "text-orange-500"}`}>
          "{name}"
        </span>{" "}
        {type === "join" ? "vừa tham gia!" : "đã rời phòng"}
      </span>
    </motion.div>
  );
}
