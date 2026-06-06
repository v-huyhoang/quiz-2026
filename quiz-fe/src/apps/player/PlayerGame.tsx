import { useState, useEffect, memo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Clock, Loader2, Trophy, XCircle, ImageIcon } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  getPlayerGameState,
  submitAnswer,
  type CurrentQuestion,
  type GameState,
  type GameAnswer,
} from "../../services/gameService";
import backgroundImage from "../../assets/background.png";
import { QuestionTimer } from "../../components/ui/QuestionTimer";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { ANSWER_LABELS, getApiErrorMessage, resolveStorageUrl } from "../../libs/utils";
import { useGameSocket } from "../../hooks/useGameSocket";
import logoImage from "../../assets/logo.png";
import waveImage from "../../assets/wave.png";

interface QuestionStartedEvent {
  round_question_id: number;
  order_number: number;
  time_limit_seconds: number;
  round_number: number;
  total_questions: number;
  opened_at: string;
  question: {
    type: "single_choice" | "image_input";
    content: string | null;
    image_url: string | null;
    answers: GameAnswer[];
  };
}

interface QuestionClosedEvent {
  round_question_id: number;
  question: {
    type?: "single_choice" | "image_input";
    answers: GameAnswer[];
  };
}

// ── Text normalization (mirrors BE logic) ─────────────────────────────────────

function normalizeText(text: string): string {
  const from = "àáảãạăắặằẳẵâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";

  let result = text.toLowerCase().trim().replace(/\s+/g, " ");
  for (let i = 0; i < from.length; i++) {
    result = result.split(from[i]).join(to[i]);
  }
  return result;
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
  } catch {
    return;
  }
}

// ── Submission state ──────────────────────────────────────────────────────────

interface SubmissionState {
  roundQuestionId: number;
  answerId: number | null;
  result: "correct" | "incorrect" | null;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PlayerGame() {
  const { gameId } = useAuthStore();

  const [gameState, setGameState]   = useState<GameState | null>(null);
  const [nextRound, setNextRound]   = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [textInput, setTextInput]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [retryCountdown, setRetryCountdown] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submission, setSubmission] = useState<SubmissionState | null>(null);

  const startRetryCountdown = useCallback(() => {
    setRetryCountdown(3);
    retryTimerRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(retryTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
  }, []);

  const applyGameState = useCallback((state: GameState) => {
    const currentQuestion = state.current_round?.current_question;
    const mySubmission = currentQuestion?.my_submission;

    if (currentQuestion && mySubmission) {
      setSelectedId(mySubmission.answer_id);
      setTextInput(mySubmission.submitted_data?.text ?? "");
      setSubmission({
        roundQuestionId: currentQuestion.round_question_id,
        answerId: mySubmission.answer_id,
        result: mySubmission.is_correct ? "correct" : "incorrect",
      });
    } else {
      setSelectedId(null);
      setTextInput("");
      setSubmission(null);
    }

    setSubmitError("");
    setRetryCountdown(0);
    setGameState(state);
  }, []);

  // ── Initial state fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    getPlayerGameState(gameId)
      .then((res) => applyGameState(res.data.data))
      .catch(() => {});
  }, [applyGameState, gameId]);

  // ── WebSocket subscription ────────────────────────────────────────────────────
  useGameSocket(gameId, {
    ".game.started": (data: { rounds_total: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, status: "active", rounds_total: data.rounds_total } : prev
      );
    },
    ".question.started": (data: QuestionStartedEvent) => {
      setSelectedId(null);
      setTextInput("");
      setSubmitError("");
      setSubmission(null);
      setRetryCountdown(0);
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);

      setGameState((prev) => {
        if (!prev) return prev;
        const newQuestion: CurrentQuestion = {
          round_question_id: data.round_question_id,
          order_number:      data.order_number,
          type:              data.question.type ?? "single_choice",
          content:           data.question.content ?? null,
          image_url:         data.question.image_url ?? null,
          status:            "open",
          opened_at:         data.opened_at ?? new Date().toISOString(),
          time_limit_seconds: data.time_limit_seconds,
          answers:           data.question.answers,
        };
        const isSameRound = prev.current_round?.round_number === data.round_number;
        return {
          ...prev,
          current_round: {
            round_number:    data.round_number,
            status:          "active",
            questions_done:  isSameRound ? (prev.current_round?.questions_done ?? 0) : 0,
            total_questions: data.total_questions,
            current_question: newQuestion,
          },
        };
      });
    },
    ".question.closed": (data: QuestionClosedEvent) => {
      setRetryCountdown(0);
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
      setGameState((prev) => {
        if (!prev?.current_round?.current_question) return prev;
        return {
          ...prev,
          current_round: {
            ...prev.current_round,
            questions_done: prev.current_round.questions_done + 1,
            current_question: {
              ...prev.current_round.current_question,
              status:  "closed",
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

  const question   = gameState?.current_round?.current_question ?? null;
  const rqId       = question?.round_question_id ?? null;
  const alreadySubmitted = rqId !== null && submission?.roundQuestionId === rqId;
  const submitResult     = alreadySubmitted ? submission.result : null;
  const isLastQuestion   = (question?.order_number ?? 0) >= (gameState?.current_round?.total_questions ?? 0);

  // ── single_choice submit ──────────────────────────────────────────────────────
  const handleChoiceSubmit = useCallback(async () => {
    if (!question || !selectedId || submitting || alreadySubmitted) return;

    setSubmitting(true);
    setSubmitError("");

    const responseTimeMs = question.opened_at
      ? Date.now() - new Date(question.opened_at).getTime()
      : 0;

    try {
      const res = await submitAnswer({
        round_question_id: question.round_question_id,
        answer_id:         selectedId,
        response_time_ms:  responseTimeMs,
      });
      const isCorrect = res.data.data?.is_correct ?? false;
      setSubmission({ roundQuestionId: question.round_question_id, answerId: selectedId, result: isCorrect ? "correct" : "incorrect" });
      if (isCorrect) saveCorrectAnswer(gameId!, gameState?.current_round?.round_number ?? 0, question.round_question_id, responseTimeMs);
    } catch (e: unknown) {
      if ((e as { response?: { status?: number } })?.response?.status === 409) {
        if (gameId) {
          getPlayerGameState(gameId)
            .then((res) => applyGameState(res.data.data))
            .catch(() => setSubmission({ roundQuestionId: question.round_question_id, answerId: selectedId, result: null }));
        }
      } else {
        setSubmitError(getApiErrorMessage(e, "Không thể nộp. Thử lại."));
      }
    } finally {
      setSubmitting(false);
    }
  }, [question, selectedId, submitting, alreadySubmitted, gameState, gameId, applyGameState]);

  // ── image_input submit ────────────────────────────────────────────────────────
  const handleTextSubmit = useCallback(async () => {
    if (!question || submitting || retryCountdown > 0) return;
    if (submitResult === "correct") return;
    const trimmed = textInput.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setSubmitError("");

    const responseTimeMs = question.opened_at
      ? Date.now() - new Date(question.opened_at).getTime()
      : 0;

    try {
      const res = await submitAnswer({
        round_question_id: question.round_question_id,
        text_answer:       normalizeText(trimmed),
        response_time_ms:  responseTimeMs,
      });
      const isCorrect = res.data.data?.is_correct ?? false;
      setSubmission({ roundQuestionId: question.round_question_id, answerId: null, result: isCorrect ? "correct" : "incorrect" });
      if (isCorrect) {
        saveCorrectAnswer(gameId!, gameState?.current_round?.round_number ?? 0, question.round_question_id, responseTimeMs);
      } else {
        startRetryCountdown();
      }
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        if (gameId) getPlayerGameState(gameId).then((res) => applyGameState(res.data.data)).catch(() => {});
      } else {
        setSubmitError(getApiErrorMessage(e, "Không thể nộp. Thử lại."));
      }
    } finally {
      setSubmitting(false);
    }
  }, [question, submitting, retryCountdown, submitResult, textInput, gameState, gameId, applyGameState, startRetryCountdown]);

  // ─────────────────────────────────────────────────────────────────────────────

  if (!gameState) return <LoadingScreen />;

  if (gameState.status === "finished") return <GameFinished gameId={gameId!} totalRounds={gameState.rounds_total} />;

  const effectiveNextRound = gameState.current_round?.status === "finished"
    ? (gameState.current_round.round_number + 1)
    : nextRound;

  if (gameState.status === "active" && (!gameState.current_round || gameState.current_round.status === "finished")) {
    return <WaitingForRound roundNum={effectiveNextRound} totalRounds={gameState.rounds_total} gameId={gameId!} />;
  }

  if (!question) return <LoadingScreen message="Chờ câu hỏi tiếp theo..." />;

  if (question.status === "closed") {
    return (
      <ClosedScreen
        question={question}
        myAnswerId={alreadySubmitted ? submission.answerId : null}
        totalQuestions={gameState.current_round?.total_questions ?? 0}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-xs sm:text-sm font-black text-gray-900">
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

        {/* Question content — branches by type */}
        {question.type === "image_input" ? (
          <ImageInputQuestion
            question={question}
            textInput={textInput}
            onTextChange={setTextInput}
            onSubmit={handleTextSubmit}
            submitting={submitting}
            submitResult={submitResult}
            retryCountdown={retryCountdown}
            submitError={submitError}
            isLastQuestion={isLastQuestion}
          />
        ) : (
          <SingleChoiceQuestion
            question={question}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onSubmit={handleChoiceSubmit}
            submitting={submitting}
            alreadySubmitted={alreadySubmitted}
            submitResult={submitResult}
            submitError={submitError}
            isLastQuestion={isLastQuestion}
          />
        )}
      </main>
    </div>
  );
}

// ── ImageInputQuestion ────────────────────────────────────────────────────────

function ImageInputQuestion({
  question,
  textInput,
  onTextChange,
  onSubmit,
  submitting,
  submitResult,
  retryCountdown,
  submitError,
  isLastQuestion,
}: {
  question: CurrentQuestion;
  textInput: string;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitResult: "correct" | "incorrect" | null;
  retryCountdown: number;
  submitError: string;
  isLastQuestion: boolean;
}) {
  const isCorrect  = submitResult === "correct";
  const isWrong    = submitResult === "incorrect";
  const canRetry   = isWrong && retryCountdown === 0;
  const inputDisabled = isCorrect || submitting || (isWrong && retryCountdown > 0);

  return (
    <motion.div
      key={question.round_question_id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 sm:gap-6"
    >
      {/* Image */}
      <div className="w-fit mx-auto rounded-2xl overflow-hidden border-2 sm:border-4 border-white shadow-xl bg-transparent flex items-center justify-center">
        {question.image_url ? (
          <img
            src={resolveStorageUrl(question.image_url) ?? ""}
            alt="Câu hỏi"
            className="max-w-full h-auto block"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 sm:py-12 px-12 text-gray-300">
            <ImageIcon size={48} />
            <span className="text-sm font-bold">Không tải được ảnh</span>
          </div>
        )}
      </div>

      {question.type === "image_input" ? (
        <p className="text-center text-base sm:text-lg font-bold text-primary">Nhìn hình đoán câu thành ngữ</p>
      ) : question.content && (
        <p className="text-center text-base sm:text-lg font-bold text-gray-500">{question.content}</p>
      )}

      {/* Input area */}
      <div className="flex flex-col gap-3">
        <div className={`flex gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-2xl border-2 sm:border-4 bg-white transition-colors ${
          isCorrect ? "border-green-400" : isWrong && retryCountdown > 0 ? "border-red-300" : "border-white"
        }`}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !inputDisabled && onSubmit()}
            disabled={inputDisabled}
            placeholder="Nhập câu trả lời..."
            className="flex-1 bg-transparent px-3 py-2 text-base sm:text-lg font-bold text-gray-900 focus:outline-none placeholder:text-gray-300 disabled:opacity-50"
          />
          <button
            onClick={onSubmit}
            disabled={inputDisabled || !textInput.trim()}
            className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center gap-2 ${
              isCorrect
                ? "bg-green-500 text-white cursor-default"
                : inputDisabled || !textInput.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isCorrect ? (
              <CheckCircle size={16} />
            ) : (
              "Gửi"
            )}
          </button>
        </div>

        {/* Feedback */}
        <AnimatePresence mode="wait">
          {isCorrect ? (
            <motion.div
              key="correct"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 font-bold text-sm"
            >
              <CheckCircle size={18} className="text-green-500 shrink-0" />
              <span>Chính xác! 🎉</span>
              {!isLastQuestion && (
                <span className="ml-auto text-xs text-green-500 font-medium flex items-center gap-1">
                  <Clock size={12} className="animate-pulse" /> Chờ câu tiếp
                </span>
              )}
            </motion.div>
          ) : isWrong && retryCountdown > 0 ? (
            <motion.div
              key="retry"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm"
            >
              <XCircle size={18} className="shrink-0" />
              <span>Sai rồi! Thử lại sau</span>
              <span className="ml-auto text-lg font-black text-red-500">{retryCountdown}s</span>
            </motion.div>
          ) : canRetry ? (
            <motion.div
              key="can-retry"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-50 border-2 border-orange-200 text-orange-600 font-bold text-sm"
            >
              <XCircle size={18} className="shrink-0" />
              <span>Chưa đúng — hãy thử lại!</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {submitError && (
          <p className="text-center text-red-500 text-sm font-semibold">{submitError}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── SingleChoiceQuestion ──────────────────────────────────────────────────────

function SingleChoiceQuestion({
  question,
  selectedId,
  onSelect,
  onSubmit,
  submitting,
  alreadySubmitted,
  submitResult,
  submitError,
  isLastQuestion,
}: {
  question: CurrentQuestion;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  alreadySubmitted: boolean;
  submitResult: "correct" | "incorrect" | null;
  submitError: string;
  isLastQuestion: boolean;
}) {
  return (
    <>
      <motion.div
        key={question.round_question_id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6 sm:mb-12"
      >
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight">
          {question.content}
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {question.answers.map((ans, i) => {
          const isSelected = selectedId === ans.id;
          return (
            <motion.button
              key={ans.id}
              whileTap={!alreadySubmitted ? { scale: 0.98 } : {}}
              onClick={() => { if (!alreadySubmitted) onSelect(ans.id!); }}
              disabled={alreadySubmitted}
              className={`p-4 sm:p-6 rounded-xl border-2 sm:border-4 text-left transition-all flex justify-between items-center
                ${alreadySubmitted ? "cursor-not-allowed" : "cursor-pointer"}
                ${isSelected
                  ? "border-primary bg-primary/5 ring-2 sm:ring-4 ring-primary/10"
                  : alreadySubmitted
                    ? "border-gray-200 bg-gray-50 opacity-40"
                    : "border-white bg-white hover:border-primary/20 shadow-sm"
                }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold border-2 ${
                  isSelected ? "bg-primary text-white border-primary" : "text-gray-400 border-gray-100"
                }`}>
                  {ANSWER_LABELS[i]}
                </span>
                <span className={`font-bold text-base sm:text-lg ${isSelected ? "text-primary" : "text-gray-700"}`}>
                  {ans.content}
                </span>
              </div>
              {isSelected && <CheckCircle className="text-primary shrink-0 sm:w-6 sm:h-6" size={20} />}
            </motion.button>
          );
        })}
      </div>

      {submitError && (
        <p className="mt-4 text-center text-red-500 text-xs sm:text-sm font-semibold">{submitError}</p>
      )}

      <div className="mt-8 sm:mt-12 flex justify-center">
        <AnimatePresence mode="wait">
          {!alreadySubmitted ? (
            <motion.button
              key="submit"
              onClick={onSubmit}
              disabled={!selectedId || submitting}
              whileHover={selectedId ? { scale: 1.03 } : {}}
              whileTap={selectedId ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`group relative flex items-center gap-2 sm:gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm tracking-widest uppercase text-white overflow-hidden transition-all ${
                selectedId && !submitting ? "bg-primary cursor-pointer" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {submitting
                ? <Loader2 size={18} className="animate-spin relative z-10" />
                : <CheckCircle size={18} className="relative z-10 shrink-0" />}
              <span className="relative z-10">{submitting ? "Đang gửi..." : "Chốt kèo"}</span>
            </motion.button>
          ) : submitResult === "correct" ? (
            <motion.div key="correct" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 sm:gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl border-2 border-green-300 bg-green-50 text-green-700 font-bold text-xs sm:text-sm tracking-widest uppercase">
                <CheckCircle size={18} className="shrink-0 text-green-500" />
                <span>Chính xác!</span>
              </div>
              {!isLastQuestion && (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Clock size={14} className="animate-pulse" />
                  <span>Chờ câu tiếp theo</span>
                  <PulsingDots />
                </div>
              )}
            </motion.div>
          ) : submitResult === "incorrect" ? (
            <motion.div key="incorrect" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 sm:gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-bold text-xs sm:text-sm tracking-widest uppercase">
                <XCircle size={18} className="shrink-0" />
                <span>Sai rồi!</span>
              </div>
              {!isLastQuestion && (
                <p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Cố lên ở câu tiếp theo nhé 💪
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div key="waiting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 sm:gap-3 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary font-bold text-xs sm:text-sm tracking-widest uppercase">
              <Clock size={18} className="shrink-0 animate-pulse" />
              <span>Đã nộp{!isLastQuestion && " · Đang chờ..."}</span>
              {!isLastQuestion && <PulsingDots />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── ClosedScreen ──────────────────────────────────────────────────────────────

function ClosedScreen({
  question,
  myAnswerId,
  totalQuestions,
}: {
  question: CurrentQuestion;
  myAnswerId: number | null;
  totalQuestions: number;
}) {
  const isLast     = totalQuestions > 0 && question.order_number >= totalQuestions;
  const correctAns = question.answers.find((a) => a.is_correct === true);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-xs sm:text-sm font-black text-gray-900">
              Câu {question.order_number}
              <span className="text-gray-400 font-bold"> / {totalQuestions}</span>
            </span>
            <QuestionProgress current={question.order_number} total={totalQuestions} />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest border border-gray-200 px-2 sm:px-3 py-1 rounded-full">
            Đáp án
          </span>
        </div>

        {question.type === "image_input" ? (
          // ── image_input: show image + correct answer reveal ──────────────────
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            {question.image_url && (
              <div className="w-fit mx-auto rounded-2xl overflow-hidden border-2 sm:border-4 border-white shadow-xl bg-transparent flex items-center justify-center">
                <img src={resolveStorageUrl(question.image_url) ?? ""} alt="Câu hỏi" className="max-w-full h-auto max-h-[40vh] block" />
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full rounded-2xl border-2 sm:border-4 border-green-400 bg-green-50 px-4 sm:px-8 py-4 sm:py-6 text-center"
            >
              <p className="text-[10px] sm:text-xs font-black text-green-500 uppercase tracking-widest mb-1 sm:mb-2">Đáp án đúng</p>
              <p className="text-2xl sm:text-3xl font-black text-green-800">{correctAns?.content ?? "—"}</p>
            </motion.div>
            {!isLast && (
              <div className="text-center">
                <p className="text-xs sm:text-sm font-bold text-gray-400">Chờ câu hỏi tiếp theo...</p>
                <span className="flex gap-1.5 justify-center mt-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
                  ))}
                </span>
              </div>
            )}
          </div>
        ) : (
          // ── single_choice: existing grid ─────────────────────────────────────
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-6 sm:mb-8 text-center">
              {question.content}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {question.answers.map((ans, i) => {
                const isCorrect = ans.is_correct === true;
                const isMine    = myAnswerId !== null && myAnswerId === ans.id;
                return (
                  <div
                    key={ans.id ?? i}
                    className={`p-4 sm:p-6 rounded-xl border-2 sm:border-4 flex items-center gap-3 sm:gap-4 transition-all ${
                      isCorrect ? "border-green-400 bg-green-50"
                        : isMine  ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50 opacity-50"
                    }`}
                  >
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold border-2 ${
                      isCorrect ? "bg-green-500 text-white border-green-500"
                        : isMine  ? "bg-red-400 text-white border-red-400"
                        : "text-gray-300 border-gray-200"
                    }`}>
                      {ANSWER_LABELS[i]}
                    </span>
                    <span className={`font-bold text-base sm:text-lg flex-1 ${
                      isCorrect ? "text-green-800" : isMine ? "text-red-700" : "text-gray-400"
                    }`}>
                      {ans.content}
                    </span>
                    {isCorrect && <CheckCircle className="text-green-500 shrink-0 sm:w-6 sm:h-6" size={20} />}
                  </div>
                );
              })}
            </div>
            {!isLast && (
              <div className="mt-8 sm:mt-10 text-center">
                <p className="text-xs sm:text-sm font-bold text-gray-400">Chờ câu hỏi tiếp theo...</p>
                <span className="flex gap-1.5 justify-center mt-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
                  ))}
                </span>
              </div>
            )}
          </>
        )}
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

function WaitingForRound({ roundNum, totalRounds, gameId }: { roundNum: number; totalRounds: number; gameId: number }) {
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-primary/6 rounded-full blur-[60px] sm:blur-[80px] pointer-events-none" />

      <motion.div className="flex-shrink-0 flex flex-col items-center justify-center pt-12 sm:pt-20 pb-6 sm:pb-10 relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <motion.div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 sm:mb-7" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
          <Trophy size={32} className="sm:w-9 sm:h-9 text-primary" />
        </motion.div>
        <motion.div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-primary/8 border border-primary/20 rounded-full mb-4 sm:mb-5" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }}>
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest">Sắp bắt đầu</span>
        </motion.div>
        <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.25em] mb-1">Chuẩn bị cho</p>
        <p className="text-5xl sm:text-7xl font-black text-gray-900 leading-none mb-1">Vòng {roundNum}</p>
        {totalRounds > 0 && <p className="text-base sm:text-lg font-bold text-gray-400 mb-4 sm:mb-6">/ {totalRounds}</p>}
        <div className="flex gap-1.5 sm:gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.35 }} />
          ))}
        </div>
      </motion.div>

      {myRounds.length > 0 && (
        <div className="flex-grow w-full max-w-lg mx-auto px-4 sm:px-6 pb-10 relative z-10">
          <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3 sm:mb-4">Kết quả các vòng trước</p>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {myRounds.map((round) => (
              <div key={round.round_number} className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-black text-primary">{round.round_number}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-gray-700 uppercase tracking-wide">Vòng {round.round_number}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className={`text-xs sm:text-sm font-bold ${round.correct_count > 0 ? "text-green-600" : "text-gray-400"}`}>{round.correct_count} đúng</span>
                  <span className="text-xs sm:text-sm font-mono text-gray-400">{round.total_time_seconds.toFixed(2)}s</span>
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
      const entries: CorrectAnswerRecord[] = JSON.parse(localStorage.getItem(lsKey(gameId, roundNum)) ?? "[]");
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
      <img src={waveImage} alt="" className="absolute bottom-0 right-0 opacity-40 pointer-events-none select-none z-0" />
      <img src={logoImage} alt="Logo" className="h-16 sm:h-24 w-auto object-contain drop-shadow-md" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[200px] sm:h-[300px] bg-yellow-400/8 rounded-full blur-[60px] sm:blur-[80px] pointer-events-none" />

      <motion.div className="flex-shrink-0 flex flex-col items-center pt-8 sm:pt-16 pb-6 sm:pb-8 relative z-10" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: "easeOut" }}>
        <motion.div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center mb-4 sm:mb-5 shadow-lg shadow-yellow-100" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
          <Trophy size={32} className="sm:w-10 sm:h-10 text-yellow-500" />
        </motion.div>
        <motion.div className="flex justify-center gap-1 mb-3 sm:mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.svg key={i} viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </motion.svg>
          ))}
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary leading-tight text-center mb-1">Trận đấu kết thúc!</h2>
        <p className="text-xs sm:text-sm font-bold text-gray-400">Cảm ơn đã tham gia!</p>
      </motion.div>

      <div className="flex-grow w-full max-w-lg mx-auto px-4 sm:px-6 pb-12 relative z-10">
        <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-3 sm:mb-4">Kết quả của bạn</p>
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {roundResults.map((round) => (
            <div key={round.round_number} className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-black text-primary">{round.round_number}</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-primary uppercase tracking-wide">Vòng {round.round_number}</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className={`text-xs sm:text-sm font-bold ${round.correct_count > 0 ? "text-green-600" : "text-gray-400"}`}>{round.correct_count} đúng</span>
                <span className="text-xs sm:text-sm font-mono text-gray-400">{round.total_time_seconds.toFixed(2)}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
