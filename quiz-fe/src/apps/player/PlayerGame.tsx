import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Timer, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  getPublicGameState,
  submitAnswer,
  type CurrentQuestion,
  type GameState,
} from "../../services/gameService";

const LABELS = ["A", "B", "C", "D"];

export default function PlayerGame() {
  const { gameId } = useAuthStore();

  const [gameState, setGameState]     = useState<GameState | null>(null);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Track which round_question_id the player already submitted so we don't re-submit on re-render
  const submittedRqId = useRef<number | null>(null);

  // ── Polling ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await getPublicGameState(gameId);
        if (!cancelled) setGameState(res.data.data);
      } catch {
        // ignore silently
      }
      if (!cancelled) setTimeout(poll, 2000);
    };

    poll();
    return () => { cancelled = true; };
  }, [gameId]);

  // Reset selection when a new question appears
  const question = gameState?.current_round?.current_question ?? null;
  const rqId     = question?.round_question_id ?? null;

  useEffect(() => {
    if (rqId !== null && rqId !== submittedRqId.current) {
      setSelectedId(null);
      setSubmitError("");
    }
  }, [rqId]);

  const alreadySubmitted = rqId !== null && submittedRqId.current === rqId;

  const handleSubmit = async () => {
    if (!question || !selectedId || submitting || alreadySubmitted) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await submitAnswer(question.round_question_id, selectedId);
      submittedRqId.current = question.round_question_id;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      // 409 = already submitted (race), treat as success
      if ((e as { response?: { status?: number } })?.response?.status === 409) {
        submittedRqId.current = question.round_question_id;
      } else {
        setSubmitError(msg ?? "Không thể nộp. Thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!question) {
    return <WaitingScreen message="Chờ câu hỏi tiếp theo..." />;
  }

  if (question.status === "closed") {
    return <ClosedScreen question={question} myAnswerId={alreadySubmitted ? selectedId : null} />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-3 py-1 rounded-full">
            Câu {question.order_number} / {gameState.current_round?.total_questions}
          </span>
          <QuestionTimer openedAt={question.opened_at!} limitSec={question.time_limit_seconds} />
        </div>

        {/* Question text */}
        <motion.div
          key={question.round_question_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            {question.content}
          </h2>
        </motion.div>

        {/* Answers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.answers.map((ans, i) => {
            const isSelected = selectedId === ans.id;
            return (
              <motion.button
                key={ans.id}
                whileTap={!alreadySubmitted ? { scale: 0.98 } : {}}
                onClick={() => { if (!alreadySubmitted) setSelectedId(ans.id); }}
                disabled={alreadySubmitted}
                className={`p-6 rounded-xl border-4 text-left transition-all flex justify-between items-center
                  ${alreadySubmitted ? "cursor-not-allowed" : "cursor-pointer"}
                  ${isSelected
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                    : alreadySubmitted
                      ? "border-gray-100 bg-gray-50 opacity-40"
                      : "border-white bg-white hover:border-primary/20 shadow-sm"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 ${
                    isSelected ? "bg-primary text-white border-primary" : "text-gray-400 border-gray-100"
                  }`}>
                    {LABELS[i]}
                  </span>
                  <span className={`font-bold text-lg ${isSelected ? "text-primary" : "text-gray-700"}`}>
                    {ans.content}
                  </span>
                </div>
                {isSelected && <CheckCircle className="text-primary shrink-0" size={24} />}
              </motion.button>
            );
          })}
        </div>

        {/* Error */}
        {submitError && (
          <p className="mt-4 text-center text-red-500 text-sm font-semibold">{submitError}</p>
        )}

        {/* Submit / Submitted */}
        <div className="mt-12 flex justify-center">
          <AnimatePresence mode="wait">
            {!alreadySubmitted ? (
              <motion.button
                key="submit"
                onClick={handleSubmit}
                disabled={!selectedId || submitting}
                whileHover={selectedId ? { scale: 1.03 } : {}}
                whileTap={selectedId ? { scale: 0.97 } : {}}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative flex items-center gap-3 px-7 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase text-white overflow-hidden transition-all ${
                  selectedId && !submitting ? "bg-primary cursor-pointer" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {submitting
                  ? <Loader2 size={18} className="animate-spin relative z-10" />
                  : <CheckCircle size={18} className="relative z-10 shrink-0" />}
                <span className="relative z-10">{submitting ? "Đang nộp..." : "Submit"}</span>
              </motion.button>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-7 py-4 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary font-bold text-sm tracking-widest uppercase"
              >
                <Clock size={18} className="shrink-0 animate-pulse" />
                <span>Đã nộp · Đang chờ câu tiếp theo...</span>
                <span className="flex gap-1 ml-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function QuestionTimer({ openedAt, limitSec }: { openedAt: string; limitSec: number }) {
  const elapsed = Math.floor((Date.now() - new Date(openedAt).getTime()) / 1000);
  const [left, setLeft] = useState(Math.max(0, limitSec - elapsed));

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [left]);

  return (
    <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg border shadow-sm transition-colors ${
      left <= 10 ? "text-red-500 border-red-200 bg-red-50" : "text-primary border-gray-200 bg-white"
    }`}>
      <Timer size={20} />
      0:{left.toString().padStart(2, "0")}
    </div>
  );
}

function WaitingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-bold">{message}</p>
      </div>
    </div>
  );
}

function ClosedScreen({ question, myAnswerId }: { question: CurrentQuestion; myAnswerId: number | null }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6 text-center">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest border border-gray-200 px-3 py-1 rounded-full">
            Câu hỏi đã đóng — Đáp án
          </span>
        </div>

        <h2 className="text-3xl font-black text-gray-900 leading-tight mb-8 text-center">
          {question.content}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.answers.map((ans, i) => {
            const isCorrect = ans.is_correct === true;
            const isMine    = myAnswerId === ans.id;
            return (
              <div
                key={ans.id}
                className={`p-6 rounded-xl border-4 flex items-center gap-4 transition-all ${
                  isCorrect
                    ? "border-green-400 bg-green-50"
                    : isMine
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 bg-gray-50 opacity-50"
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 ${
                  isCorrect ? "bg-green-500 text-white border-green-500"
                    : isMine ? "bg-red-400 text-white border-red-400"
                    : "text-gray-300 border-gray-200"
                }`}>
                  {LABELS[i]}
                </span>
                <span className={`font-bold text-lg flex-1 ${
                  isCorrect ? "text-green-800" : isMine ? "text-red-700" : "text-gray-400"
                }`}>
                  {ans.content}
                </span>
                {isCorrect && <CheckCircle className="text-green-500 shrink-0" size={24} />}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm font-bold text-gray-400">Chờ câu hỏi tiếp theo...</p>
          <span className="flex gap-1.5 justify-center mt-3">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </span>
        </div>
      </main>
    </div>
  );
}
