import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Timer, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getPublicGameState, type CurrentQuestion } from "../../services/gameService";

const LABELS = ["A", "B", "C", "D"];

export default function StageGame() {
  const [searchParams] = useSearchParams();
  const nav             = useNavigate();
  const gameId          = Number(searchParams.get("gameId"));

  const [question, setQuestion] = useState<CurrentQuestion | null>(null);
  const [roundNum, setRoundNum] = useState(1);
  const [totalQ, setTotalQ]     = useState(0);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res   = await getPublicGameState(gameId);
        const state = res.data.data;

        if (!cancelled) {
          const round = state.current_round;

          if (state.status === "finished") {
            nav(`/stage/final?gameId=${gameId}`, { replace: true });
            return;
          }

          if (!round || round.status === "finished") {
            nav(`/stage/leaderboard?gameId=${gameId}`, { replace: true });
            return;
          }

          setRoundNum(round.round_number);
          setTotalQ(round.total_questions);
          setQuestion(round.current_question);
        }
      } catch {
        // ignore
      }

      if (!cancelled) setTimeout(poll, 2000);
    };

    poll();
    return () => { cancelled = true; };
  }, [gameId, nav]);

  if (!question) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Đang chờ câu hỏi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 flex flex-col justify-center">

        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-4 py-2 rounded-full">
              Round {roundNum}
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              QUESTION {question.order_number} / {totalQ}
            </span>
          </div>

          {question.status === "open" && question.opened_at && (
            <StageTimer openedAt={question.opened_at} limitSec={question.time_limit_seconds} />
          )}
          {question.status === "closed" && (
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-2xl">
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
      </main>
    </div>
  );
}

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
