import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Trophy, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getPublicGameState, type CurrentQuestion, type GameAnswer } from "../../services/gameService";
import backgroundImage from "../../assets/background.png";
import StageRoundComplete from "./StageRoundComplete";
import { QuestionTimer } from "../../components/ui/QuestionTimer";
import { GridBg } from "../../components/ui/GridBg";
import { ANSWER_LABELS, resolveStorageUrl } from "../../libs/utils";
import { useGameSocket } from "../../hooks/useGameSocket";

const LABELS = ANSWER_LABELS;

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
  opened_at: string;
  question: {
    type: "single_choice" | "image_input";
    content: string | null;
    image_url: string | null;
    answers: GameAnswer[];
  };
}

interface QuestionClosedEvent {
  question: {
    type?: "single_choice" | "image_input";
    answers: GameAnswer[];
  };
}

interface RoundFinishedEvent {
  game_id: number;
  round_number: number;
}

export default function StageGame() {
  const [searchParams] = useSearchParams();
  const gameId = Number(searchParams.get("gameId"));

  const [gameStatus, setGameStatus] = useState<string>("pending");
  const [question, setQuestion] = useState<CurrentQuestion | null>(null);
  const [roundNum, setRoundNum] = useState(1);
  const [totalQ, setTotalQ] = useState(0);
  const [roundsTotal, setRoundsTotal] = useState(0);
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const [completedRoundNum, setCompletedRoundNum] = useState(0);

  useEffect(() => {
    console.debug("[StageGame] showRoundComplete:", showRoundComplete);
  }, [showRoundComplete]);

  // ── Initial state fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    getPublicGameState(gameId)
      .then((res) => {
        const state = res.data.data;
        setGameStatus(state.status);
        setRoundsTotal(state.rounds_total);
        const round = state.current_round;
        // if (round) {
        //   setRoundNum(round.round_number);
        //   setTotalQ(round.total_questions);
        //   setQuestion(round.current_question);
        // }
        if (round) {
          setTotalQ(round.total_questions);

          if (round.status === "finished") {
            setRoundNum(round.round_number + 1);
            setQuestion(null);
          } else {
            setRoundNum(round.round_number);
            setQuestion(round.current_question);
          }
        }
      })
      .catch(() => { });
  }, [gameId]);

  // ── WebSocket subscription (hook handles subscribe/unsubscribe) ────────────
  useGameSocket(gameId || null, {
    ".game.started": (data: GameStartedEvent) => {
      setGameStatus("active");
      setRoundsTotal(data.rounds_total);
      setRoundNum(1);
      setQuestion(null);
    },
    ".question.started": (data: QuestionStartedEvent) => {
      setShowRoundComplete(false);
      setRoundNum(data.round_number);
      setTotalQ(data.total_questions);
      setQuestion({
        round_question_id: data.round_question_id,
        order_number:      data.order_number,
        type:              data.question.type ?? "single_choice",
        content:           data.question.content ?? null,
        image_url:         data.question.image_url ?? null,
        status:            "open",
        opened_at:         data.opened_at ?? new Date().toISOString(),
        time_limit_seconds: data.time_limit_seconds,
        answers:           data.question.answers,
      });
    },
    ".question.closed": (data: QuestionClosedEvent) => {
      setQuestion((prev) =>
        prev ? { ...prev, status: "closed", answers: data.question.answers } : prev
      );
    },
    ".round.finished": (data: RoundFinishedEvent) => {
      setCompletedRoundNum(data.round_number);
      setShowRoundComplete(true);
      setQuestion(null);
      setRoundNum(data.round_number + 1);
    },
    ".game.finished": () => {
      setGameStatus("finished");
    },
  });

  // ── Screens ────────────────────────────────────────────────────────────────
  if (gameStatus === "finished") {
    const popupNode = showRoundComplete ? (
      <div className="fixed right-4 sm:right-12 top-10 w-[600px] max-w-[92vw] z-[9999] pointer-events-auto">
        <div className="w-full h-full bg-transparent rounded-lg shadow-xl overflow-hidden">
          <StageRoundComplete isPopup gameId={gameId} completedRound={completedRoundNum} />
        </div>
      </div>
    ) : null;

    return (
      <>
        {popupNode}
        <StageGameFinished gameId={gameId} />
      </>
    );
  }

  // Note: `StageRoundComplete` will be rendered as a persistent left popup below

  const popupNode = showRoundComplete ? (
    <div className="fixed right-4 sm:right-12 top-10 w-[600px] max-w-[92vw] z-[9999] pointer-events-auto">
      <div className="w-full h-full bg-transparent rounded-lg shadow-xl overflow-hidden">
        <StageRoundComplete isPopup gameId={gameId} completedRound={completedRoundNum} />
      </div>
    </div>
  ) : null;

  if (gameStatus === "active" && !question) {
    return (
      <>
        {popupNode}
        <StageWaitingForRound roundNum={roundNum} roundsTotal={roundsTotal} />
      </>
    );
  }

  if (!question) {
    return (
      <>
        {popupNode}
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Đang tải...</p>
          </div>
        </div>
      </>
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
            <QuestionTimer
              openedAt={question.opened_at}
              limitSec={question.time_limit_seconds}
              variant="stage"
            />
          )}
          {question.status === "closed" && (
            <span className="text-base font-black text-gray-400 uppercase tracking-widest bg-gray-200 px-6 py-2 rounded-2xl">
              Đã đóng
            </span>
          )}
        </div>

        {/* Question content — branches by type */}
        {question.type === "image_input" ? (
          <StageImageInputQuestion question={question} />
        ) : (
          <StageChoiceQuestion question={question} />
        )}
      </main>
      <GridBg />
    </div>
  );
}

// ── Stage question sub-components ────────────────────────────────────────────

function StageImageInputQuestion({ question }: { question: CurrentQuestion }) {
  const revealed   = question.status === "closed";
  const correctAns = question.answers.find((a) => a.is_correct === true);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.round_question_id}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Image */}
        <div className="w-fit max-w-5xl rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-transparent flex items-center justify-center mx-auto">
          {question.image_url ? (
            <img src={resolveStorageUrl(question.image_url) ?? ""} alt="Câu hỏi" className="max-w-full h-auto max-h-[60vh] block" />
          ) : (
            <div className="py-24 text-gray-300 text-center">
              <span className="text-lg font-bold">Không tải được ảnh</span>
            </div>
          )}
        </div>

        {question.type === "image_input" ? (
          <p className="text-2xl font-bold text-primary text-center">Nhìn hình đoán câu thành ngữ</p>
        ) : question.content && (
          <p className="text-2xl font-bold text-gray-500 text-center">{question.content}</p>
        )}

        {/* Reveal correct answer when closed */}
        {revealed && correctAns && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl rounded-3xl border-4 border-green-400 bg-green-50 px-10 py-8 text-center shadow-xl"
          >
            <p className="text-sm font-black text-green-500 uppercase tracking-widest mb-3">Đáp án đúng</p>
            <p className="text-5xl md:text-6xl font-black text-green-800 leading-tight">{correctAns.content}</p>
          </motion.div>
        )}

        {!revealed && (
          <p className="text-xl font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Đang chờ player trả lời...
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function StageChoiceQuestion({ question }: { question: CurrentQuestion }) {
  const revealed = question.status === "closed";

  return (
    <>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full"
      >
        {question.answers.map((ans, i) => {
          const isCorrect = ans.is_correct === true;
          return (
            <motion.div
              key={ans.id ?? i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={`border-4 rounded-2xl p-8 flex items-center gap-6 shadow-lg transition-all ${
                revealed
                  ? isCorrect ? "bg-green-50 border-green-400" : "bg-gray-50 border-gray-200 opacity-50"
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
              <span className={`text-2xl md:text-3xl font-bold flex-1 ${revealed && isCorrect ? "text-green-800" : "text-gray-900"}`}>
                {ans.content}
              </span>
              {revealed && isCorrect && <CheckCircle size={32} className="text-green-500 shrink-0" />}
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
}

// ── Waiting for round (Stage — large screen) ──────────────────────────────────
function StageWaitingForRound({
  roundNum,
  roundsTotal,
}: {
  roundNum: number;
  roundsTotal: number;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Soft glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Round number section */}
      <div className="flex flex-col items-center justify-center py-16 relative z-10">
        <motion.div
          className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-primary/8 border border-primary/20 rounded-full mb-10"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-lg font-black text-primary uppercase tracking-[0.2em]">Sắp bắt đầu</span>
        </motion.div>

        <p className="text-base font-black text-gray-400 uppercase tracking-[0.35em] mb-3">Vòng đấu</p>

        <motion.p
          className="text-[180px] md:text-[220px] font-black leading-none text-primary tracking-tight select-none"
          animate={{ scale: [1, 1.012, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {roundNum}
        </motion.p>

        {roundsTotal > 0 && (
          <p className="text-3xl font-bold text-gray-300 -mt-4 mb-10">/ {roundsTotal}</p>
        )}

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
      </div>

      <GridBg />
    </div>
  );
}

// ── Game finished (Stage) ─────────────────────────────────────────────────────
function StageGameFinished({ gameId }: { gameId: number }) {
  const navigate = useNavigate();

  // Auto-navigate to final results after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => {
      navigate(`/stage/final?gameId=${gameId}`);
    }, 3000);

    return () => clearTimeout(t);
  }, [gameId, navigate]);

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
        <p className="text-2xl md:text-3xl font-bold text-gray-400 mb-10">Cảm ơn đã tham gia!</p>

        <motion.button
          onClick={() => navigate(`/stage/final?gameId=${gameId}`)}
          className="px-10 py-4 bg-gray-900 text-white text-xl font-black rounded-2xl shadow-lg hover:bg-gray-700 transition-colors"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Xem kết quả
        </motion.button>
      </motion.div>

      <GridBg />
    </div>
  );
}
