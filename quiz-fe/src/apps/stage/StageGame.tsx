import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Timer, CheckCircle, Trophy, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getPublicGameState, type CurrentQuestion, type GameAnswer } from "../../services/gameService";
import { getGameChannel } from "../../sockets/channels/game-channel";
import { getEcho } from "../../sockets/echo";
import backgroundImage from "../../assets/background.png";

const LABELS = ["A", "B", "C", "D"];

interface GameStartedEvent {
  game_id: number;
  status: string;
  rounds_total: number;
}

interface QuestionStartedEvent {
  round_question_id: number;
  order_number: number;
  time_limit_seconds: number;
  round_number: number;
  total_questions: number;
  question: { content: string; answers: GameAnswer[] };
}

interface QuestionClosedEvent {
  question: { answers: GameAnswer[] };
}

interface RoundFinishedEvent {
  game_id: number;
  round_number: number;
}

export default function StageGame() {
  const [searchParams] = useSearchParams();
  const gameId          = Number(searchParams.get("gameId"));

  const [gameStatus, setGameStatus]   = useState<string>("pending");
  const [question, setQuestion]       = useState<CurrentQuestion | null>(null);
  const [roundNum, setRoundNum]       = useState(1);
  const [totalQ, setTotalQ]           = useState(0);
  const [roundsTotal, setRoundsTotal] = useState(0);

  // ── Initial state fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    getPublicGameState(gameId)
      .then((res) => {
        const state = res.data.data;
        setGameStatus(state.status);
        setRoundsTotal(state.rounds_total);
        const round = state.current_round;
        if (round) {
          setRoundNum(round.round_number);
          setTotalQ(round.total_questions);
          setQuestion(round.current_question);
        }
      })
      .catch(() => {});
  }, [gameId]);

  // ── WebSocket subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;

    const channel = getGameChannel(String(gameId));

    channel.listen(".game.started", (data: GameStartedEvent) => {
      setGameStatus("active");
      setRoundsTotal(data.rounds_total);
      setRoundNum(1);
      setQuestion(null);
    });

    channel.listen(".question.started", (data: QuestionStartedEvent) => {
      setRoundNum(data.round_number);
      setTotalQ(data.total_questions);
      setQuestion({
        round_question_id:  data.round_question_id,
        order_number:       data.order_number,
        content:            data.question.content,
        status:             "open",
        opened_at:          new Date().toISOString(),
        time_limit_seconds: data.time_limit_seconds,
        answers:            data.question.answers,
      });
    });

    channel.listen(".question.closed", (data: QuestionClosedEvent) => {
      setQuestion((prev) =>
        prev ? { ...prev, status: "closed", answers: data.question.answers } : prev
      );
    });

    channel.listen(".round.finished", (data: RoundFinishedEvent) => {
      setQuestion(null);
      setRoundNum(data.round_number + 1);
    });

    channel.listen(".game.finished", () => {
      setGameStatus("finished");
    });

    return () => {
      getEcho().leave(`game.${gameId}`);
    };
  }, [gameId]);

  // ── Screens ────────────────────────────────────────────────────────────────
  if (gameStatus === "finished") {
    return <StageGameFinished />;
  }

  if (gameStatus === "active" && !question) {
    return <StageWaitingForRound roundNum={roundNum} roundsTotal={roundsTotal} />;
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col pt-20 relative overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 flex flex-col justify-center">

        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-4">
            <span className="text-base font-bold text-gray-400 uppercase tracking-widest border border-gray-400 px-4 py-2 rounded-full">
              Vòng {roundNum}
            </span>
            <span className="text-base font-bold text-gray-400 uppercase tracking-widest">
              Câu hỏi {question.order_number} / {totalQ}
            </span>
          </div>

          {question.status === "open" && question.opened_at && (
            <StageTimer openedAt={question.opened_at} limitSec={question.time_limit_seconds} />
          )}
          {question.status === "closed" && (
            <span className="text-base font-black text-gray-400 uppercase tracking-widest bg-gray-200 px-6 py-2 rounded-2xl">
              Đã đóng
            </span>
          )}
        </div>

        {/* Question text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.round_question_id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight">
              {question.content}
            </h1>
          </motion.div>
        </AnimatePresence>

        {/* Answer options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full"
        >
          {question.answers.map((ans, i) => {
            const isCorrect = ans.is_correct === true;
            const revealed  = question.status === "closed";

            return (
              <motion.div
                key={ans.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className={`border-4 rounded-2xl p-8 flex items-center gap-6 shadow-lg transition-all ${
                  revealed
                    ? isCorrect
                      ? "bg-green-50 border-green-400"
                      : "bg-gray-50 border-gray-200 opacity-50"
                    : "bg-white border-gray-200"
                }`}
              >
                <span className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-black shrink-0 border-2 ${
                  revealed && isCorrect
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gray-100 border-gray-300 text-gray-600"
                }`}>
                  {LABELS[i]}
                </span>
                <span className={`text-2xl md:text-3xl font-bold flex-1 ${
                  revealed && isCorrect ? "text-green-800" : "text-gray-900"
                }`}>
                  {ans.content}
                </span>
                {revealed && isCorrect && (
                  <CheckCircle size={32} className="text-green-500 shrink-0" />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Grid background */}
        <GridBg />
      </main>
    </div>
  );
}

// ── Waiting for round (Stage — large screen) ──────────────────────────────────
function StageWaitingForRound({ roundNum, roundsTotal }: { roundNum: number; roundsTotal: number }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Soft glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        className="relative z-10 text-center px-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* "Sắp bắt đầu" badge */}
        <motion.div
          className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-primary/8 border border-primary/20 rounded-full mb-14"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-lg font-black text-primary uppercase tracking-[0.2em]">Sắp bắt đầu</span>
        </motion.div>

        {/* "Vòng đấu" label */}
        <p className="text-base font-black text-gray-400 uppercase tracking-[0.35em] mb-3">
          Vòng đấu
        </p>

        {/* Giant round number */}
        <motion.p
          className="text-[180px] md:text-[220px] font-black leading-none text-primary tracking-tight select-none"
          animate={{ scale: [1, 1.012, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {roundNum}
        </motion.p>

        {roundsTotal > 0 && (
          <p className="text-3xl font-bold text-gray-400 -mt-6 mb-14">/ {roundsTotal}</p>
        )}

        {/* Dots */}
        <div className="flex gap-4 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-4 h-4 rounded-full bg-primary/30"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45, ease: "easeInOut" }}
            />
          ))}
        </div>
      </motion.div>

      <GridBg />
    </div>
  );
}

// ── Game finished (Stage) ─────────────────────────────────────────────────────
function StageGameFinished() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 text-center px-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Floating trophy */}
        <motion.div
          className="flex justify-center mb-10"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-36 h-36 rounded-3xl bg-yellow-50 border-4 border-yellow-200 flex items-center justify-center shadow-xl shadow-yellow-100">
            <Trophy size={72} className="text-yellow-500" />
          </div>
        </motion.div>

        {/* Stars */}
        <motion.div
          className="flex justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            >
              <Star size={28} className="text-yellow-400 fill-yellow-400" />
            </motion.div>
          ))}
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-tight tracking-tight mb-6">
          TRẬN ĐẤU<br />KẾT THÚC!
        </h1>
        <p className="text-2xl md:text-3xl font-bold text-gray-400">
          Cảm ơn đã tham gia!
        </p>
      </motion.div>

      <GridBg />
    </div>
  );
}

// ── Shared grid background ─────────────────────────────────────────────────────
function GridBg() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 opacity-5">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// ── Stage countdown timer ──────────────────────────────────────────────────────
function StageTimer({ openedAt, limitSec }: { openedAt: string; limitSec: number }) {
  const elapsed = Math.floor((Date.now() - new Date(openedAt).getTime()) / 1000);
  const [left, setLeft] = useState(Math.max(0, limitSec - elapsed));

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [left]);

  return (
    <div className={`flex items-center gap-3 font-mono text-4xl font-black px-8 py-4 rounded-2xl border shadow-lg transition-all ${
      left <= 10 ? "text-red-500 border-red-300 bg-red-50" : "text-secondary border-gray-200 bg-white"
    }`}>
      <Timer size={32} />
      0:{left.toString().padStart(2, "0")}
    </div>
  );
}
