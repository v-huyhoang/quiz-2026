import { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Clock, Loader2, Trophy, XCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  getPublicGameState,
  submitAnswer,
  type CurrentQuestion,
  type GameState,
  type GameAnswer,
} from "../../services/gameService";
import { getGameChannel } from "../../sockets/channels/game-channel";
import { getEcho } from "../../sockets/echo";
import backgroundImage from "../../assets/background.png";

const LABELS = ["A", "B", "C", "D"];
import { QuestionTimer } from "../../components/ui/QuestionTimer";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { ANSWER_LABELS, getApiErrorMessage } from "../../libs/utils";
import { useGameSocket } from "../../hooks/useGameSocket";

interface QuestionStartedEvent {
  round_question_id: number;
  order_number: number;
  time_limit_seconds: number;
  round_number: number;
  total_questions: number;
  opened_at: string;
  question: { content: string; answers: GameAnswer[] };
}

interface QuestionClosedEvent {
  round_question_id: number;
  question: { answers: GameAnswer[] };
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────

interface CorrectAnswerRecord {
  round_question_id: number;
  response_time_ms: number;
}

function lsKey(gameId: number, roundNumber: number) {
  return `quiz_correct_${gameId}_round_${roundNumber}`;
}

function saveCorrectAnswer(gameId: number, roundNumber: number, rqId: number, responseTimeMs: number) {
  try {
    const key = lsKey(gameId, roundNumber);
    const existing: CorrectAnswerRecord[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!existing.find((r) => r.round_question_id === rqId)) {
      existing.push({ round_question_id: rqId, response_time_ms: responseTimeMs });
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PlayerGame() {
  const { gameId } = useAuthStore();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [nextRound, setNextRound]   = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submittedRqId = useRef<number | null>(null);
  const [submitResult, setSubmitResult] = useState<"correct" | "incorrect" | null>(null);

  // ── Initial state fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    getPublicGameState(gameId)
      .then((res) => setGameState(res.data.data))
      .catch(() => {});
  }, [gameId]);

  // ── WebSocket subscription ────────────────────────────────────────────────────
  useGameSocket(gameId, {
    ".game.started": (data: { rounds_total: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, status: "active", rounds_total: data.rounds_total } : prev
      );
    },
    ".question.started": (data: QuestionStartedEvent) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const newQuestion: CurrentQuestion = {
          round_question_id: data.round_question_id,
          order_number: data.order_number,
          content: data.question.content,
          status: "open",
          opened_at: data.opened_at ?? new Date().toISOString(),
          time_limit_seconds: data.time_limit_seconds,
          answers: data.question.answers,
        };
        const isSameRound = prev.current_round?.round_number === data.round_number;
        return {
          ...prev,
          current_round: {
            round_number: data.round_number,
            status: "active",
            questions_done: isSameRound ? (prev.current_round?.questions_done ?? 0) : 0,
            total_questions: data.total_questions,
            current_question: newQuestion,
          },
        };
      });
    },
    ".question.closed": (data: QuestionClosedEvent) => {
      setGameState((prev) => {
        if (!prev?.current_round?.current_question) return prev;
        return {
          ...prev,
          current_round: {
            ...prev.current_round,
            questions_done: prev.current_round.questions_done + 1,
            current_question: {
              ...prev.current_round.current_question,
              status: "closed",
              answers: data.question.answers,
            },
          },
        };
      });
    },
    ".round.finished": (data: { round_number: number }) => {
      setNextRound(data.round_number + 1);
      setGameState((prev) => prev ? { ...prev, current_round: null } : prev);
    },
    ".game.finished": () => {
      setGameState((prev) => prev ? { ...prev, status: "finished" } : prev);
    },
  });

  // Reset selection when a new question appears
  const question = gameState?.current_round?.current_question ?? null;
  const rqId     = question?.round_question_id ?? null;

  useEffect(() => {
    if (rqId !== null && rqId !== submittedRqId.current) {
      setSelectedId(null);
      setSubmitError("");
      setSubmitResult(null);
    }
  }, [rqId]);

  const alreadySubmitted = rqId !== null && submittedRqId.current === rqId;
  const isLastQuestion   = (question?.order_number ?? 0) >= (gameState?.current_round?.total_questions ?? 0);

  const handleSubmit = useCallback(async () => {
    if (!question || !selectedId || submitting || alreadySubmitted) return;

    setSubmitting(true);
    setSubmitError("");

    const responseTimeMs = question.opened_at
      ? Date.now() - new Date(question.opened_at).getTime()
      : 0;

    try {
      const res = await submitAnswer(question.round_question_id, selectedId, responseTimeMs);
      const isCorrect = res.data.data?.is_correct ?? false;
      submittedRqId.current = question.round_question_id;
      setSubmitResult(isCorrect ? "correct" : "incorrect");
      if (isCorrect) {
        saveCorrectAnswer(
          gameId!,
          gameState?.current_round?.round_number ?? 0,
          question.round_question_id,
          responseTimeMs,
        );
      }
    } catch (e: unknown) {
      if ((e as { response?: { status?: number } })?.response?.status === 409) {
        submittedRqId.current = question.round_question_id;
      } else {
        setSubmitError(getApiErrorMessage(e, "Không thể nộp. Thử lại."));
      }
    } finally {
      setSubmitting(false);
    }
  }, [question, selectedId, submitting, alreadySubmitted, gameState, gameId]);

  if (!gameState) return <LoadingScreen />;

  if (gameState.status === "finished") return <GameFinished gameId={gameId!} totalRounds={gameState.rounds_total} />;

  if (gameState.status === "active" && !gameState.current_round) {
    return <WaitingForRound roundNum={nextRound} totalRounds={gameState.rounds_total} gameId={gameId!} />;
  }

  if (!question) return <LoadingScreen message="Chờ câu hỏi tiếp theo..." />;

  if (question.status === "closed") {
    return (
      <ClosedScreen
        question={question}
        myAnswerId={alreadySubmitted ? selectedId : null}
        totalQuestions={gameState.current_round?.total_questions ?? 0}
      />
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-black text-gray-900">
              Câu {question.order_number}
              <span className="text-gray-400 font-bold"> / {gameState.current_round?.total_questions}</span>
            </span>
            <QuestionProgress
              current={question.order_number}
              total={gameState.current_round?.total_questions ?? 0}
            />
          </div>
          <QuestionTimer openedAt={question.opened_at!} limitSec={question.time_limit_seconds} variant="player" />
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
                      ? "border-gray-200 bg-gray-50 opacity-40"
                      : "border-white bg-white hover:border-primary/20 shadow-sm"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 ${isSelected ? "bg-primary text-white border-primary" : "text-gray-400 border-gray-200"
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
                <span className="relative z-10">{submitting ? "Đang gửi..." : "Chốt kèo"}</span>
              </motion.button>
            ) : submitResult === "correct" ? (
              <motion.div
                key="correct"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-3 px-7 py-4 rounded-2xl border-2 border-green-300 bg-green-50 text-green-700 font-bold text-sm tracking-widest uppercase">
                  <CheckCircle size={18} className="shrink-0 text-green-500" />
                  <span>Chính xác!</span>
                </div>
                {!isLastQuestion && (
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Clock size={14} className="animate-pulse" />
                    <span>Chờ câu tiếp theo</span>
                    <PulsingDots />
                  </div>
                )}
              </motion.div>
            ) : submitResult === "incorrect" ? (
              <motion.div
                key="incorrect"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-3 px-7 py-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-bold text-sm tracking-widest uppercase">
                  <XCircle size={18} className="shrink-0" />
                  <span>Sai rồi!</span>
                </div>
                {!isLastQuestion && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Cố lên ở câu tiếp theo nhé 💪
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-7 py-4 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary font-bold text-sm tracking-widest uppercase"
              >
                <Clock size={18} className="shrink-0 animate-pulse" />
                <span>Đã nộp{!isLastQuestion && " · Đang chờ..."}</span>
                {!isLastQuestion && <PulsingDots />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── Pure sub-components ───────────────────────────────────────────────────────

const PulsingDots = memo(function PulsingDots() {
  return (
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
  );
});

const QuestionProgress = memo(function QuestionProgress({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        return (
          <div
            key={n}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              n === current ? "w-5 bg-primary" :
              n <  current  ? "w-2 bg-primary/30" :
                              "w-2 bg-gray-200"
            }`}
          />
        );
      })}
    </div>
  );
});

function WaitingForRound({
  roundNum,
  totalRounds,
  gameId,
}: {
  roundNum: number;
  totalRounds: number;
  gameId: number;
}) {
  const myRounds = roundNum <= 1 ? [] : Array.from({ length: roundNum - 1 }, (_, i) => {
    const r = i + 1;
    try {
      const entries: CorrectAnswerRecord[] = JSON.parse(localStorage.getItem(lsKey(gameId, r)) ?? "[]");
      const totalMs = entries.reduce((sum, e) => sum + e.response_time_ms, 0);
      return { round_number: r, correct_count: entries.length, total_time_seconds: totalMs / 1000 };
    } catch {
      return { round_number: r, correct_count: 0, total_time_seconds: 0 };
    }
  });

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[80px] pointer-events-none" />

      {/* Waiting animation */}
      <motion.div
        className="flex-shrink-0 flex flex-col items-center justify-center pt-20 pb-10 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.div
          className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-7"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy size={36} className="text-primary" />
        </motion.div>

        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/8 border border-primary/20 rounded-full mb-5"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-black text-primary uppercase tracking-widest">Sắp bắt đầu</span>
        </motion.div>

        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.25em] mb-1">Chuẩn bị cho</p>
        <p className="text-7xl font-black text-gray-900 leading-none mb-1">Vòng {roundNum}</p>
        {totalRounds > 0 && <p className="text-lg font-bold text-gray-400 mb-6">/ {totalRounds}</p>}

        <div className="flex gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.35 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Previous rounds — my results from localStorage */}
      {myRounds.length > 0 && (
        <div className="flex-grow w-full max-w-lg mx-auto px-6 pb-10 relative z-10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">
            Kết quả các vòng trước
          </p>
          <div className="flex flex-col gap-3">
            {myRounds.map((round) => (
              <div
                key={round.round_number}
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-black text-primary">{round.round_number}</span>
                  </div>
                  <span className="text-sm font-black text-gray-700 uppercase tracking-wide">
                    Round {round.round_number}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${round.correct_count > 0 ? "text-green-600" : "text-gray-400"}`}>
                    {round.correct_count} đúng
                  </span>
                  <span className="text-sm font-mono text-gray-400">
                    {round.total_time_seconds.toFixed(1)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GameFinished({ gameId, totalRounds }: { gameId: number; totalRounds: number }) {
  const roundResults = Array.from({ length: totalRounds }, (_, i) => {
    const roundNum = i + 1;
    try {
      const entries: CorrectAnswerRecord[] = JSON.parse(
        localStorage.getItem(lsKey(gameId, roundNum)) ?? "[]"
      );
      const totalMs = entries.reduce((sum, e) => sum + e.response_time_ms, 0);
      return { round_number: roundNum, correct_count: entries.length, total_time_seconds: totalMs / 1000 };
    } catch {
      return { round_number: roundNum, correct_count: 0, total_time_seconds: 0 };
    }
  });

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-yellow-400/8 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <motion.div
        className="flex-shrink-0 flex flex-col items-center pt-16 pb-8 relative z-10"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <motion.div
          className="w-20 h-20 rounded-3xl bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center mb-5 shadow-lg shadow-yellow-100"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy size={40} className="text-yellow-500" />
        </motion.div>

        <motion.div
          className="flex justify-center gap-1 mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.svg
              key={i}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-yellow-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </motion.svg>
          ))}
        </motion.div>

        <h2 className="text-3xl font-black text-gray-900 leading-tight text-center mb-1">
          Trận đấu kết thúc!
        </h2>
        <p className="text-sm font-bold text-gray-400">Cảm ơn đã tham gia!</p>
      </motion.div>

      {/* Per-round personal stats from localStorage */}
      <div className="flex-grow w-full max-w-lg mx-auto px-6 pb-12 relative z-10">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">
          Kết quả của bạn
        </p>
        <div className="flex flex-col gap-3">
          {roundResults.map((round) => (
            <div
              key={round.round_number}
              className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-black text-primary">{round.round_number}</span>
                </div>
                <span className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  Round {round.round_number}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold ${round.correct_count > 0 ? "text-green-600" : "text-gray-400"}`}>
                  {round.correct_count} đúng
                </span>
                <span className="text-sm font-mono text-gray-400">
                  {round.total_time_seconds.toFixed(1)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClosedScreen({
  question,
  myAnswerId,
  totalQuestions,
}: {
  question: CurrentQuestion;
  myAnswerId: number | null;
  totalQuestions: number;
}) {
  const isLast = totalQuestions > 0 && question.order_number >= totalQuestions;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-black text-gray-900">
              Câu {question.order_number}
              <span className="text-gray-400 font-bold"> / {totalQuestions}</span>
            </span>
            <QuestionProgress current={question.order_number} total={totalQuestions} />
          </div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest border border-gray-200 px-3 py-1 rounded-full">
            Đáp án
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
                      : "border-gray-200 bg-gray-50 opacity-50"
                  }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 ${
                  isCorrect ? "bg-green-500 text-white border-green-500"
                    : isMine ? "bg-red-400 text-white border-red-400"
                      : "text-gray-300 border-gray-200"
                }`}>
                  {ANSWER_LABELS[i]}
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

        {!isLast && (
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
        )}
      </main>
    </div>
  );
}
