import { useState, useCallback, useEffect, memo } from "react";
import { Navbar } from "./parts/Navbar";
import { motion } from "motion/react";
import {
  Play, Pause, SkipForward, Trophy, Clock,
  Users, CheckCircle, XCircle, ArrowLeft, Loader2, Monitor,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAdminGameState, revealScreen, startGame, startRound, openQuestion, closeQuestion,
  finishRound, finishGame,
  type GameState,
} from "../../services/gameService";
import { QuestionTimer } from "../../components/ui/QuestionTimer";
import { GridBg } from "../../components/ui/GridBg";
import { ANSWER_LABELS, getApiErrorMessage } from "../../libs/utils";
import { useGameSocket } from "../../hooks/useGameSocket";

const LABELS = ANSWER_LABELS;

export default function AdminGameControl() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate   = useNavigate();
  const id         = Number(gameId);

  const [gameState, setGameState]  = useState<GameState | null>(null);
  const [loading, setLoading]      = useState(true);
  const [actionLoading, setAction] = useState(false);
  const [error, setError]          = useState("");

  // ── Initial fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getAdminGameState(id)
      .then((res) => { setGameState(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  // ── Real-time updates via WebSocket ───────────────────────────────────────────
  useGameSocket(id || null, {
    ".team.joined": (data: { team: { id: number; name: string } }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        if (prev.teams.some((t) => t.id === data.team.id)) return prev;
        return { ...prev, teams: [...prev.teams, { id: data.team.id, name: data.team.name }] };
      });
    },
    ".team.left": (data: { team: { id: number } }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, teams: prev.teams.filter((t) => t.id !== data.team.id) };
      });
    },
    ".game.started":    () => getAdminGameState(id).then((res) => setGameState(res.data.data)).catch(() => {}),
    ".question.started": () => getAdminGameState(id).then((res) => setGameState(res.data.data)).catch(() => {}),
    ".question.closed": () => getAdminGameState(id).then((res) => setGameState(res.data.data)).catch(() => {}),
    ".game.finished":   () => getAdminGameState(id).then((res) => setGameState(res.data.data)).catch(() => {}),
  });

  // ── Reveal waiting screen (doesn't change game state) ────────────────────────
  const handleReveal = useCallback(async () => {
    setAction(true);
    setError("");
    try { await revealScreen(id); } catch (e) { setError(getApiErrorMessage(e, "Có lỗi xảy ra.")); } finally { setAction(false); }
  }, [id]);

  // ── Action helpers ────────────────────────────────────────────────────────────
  const act = useCallback(async (fn: () => Promise<{ data: { data: GameState } }>) => {
    setAction(true);
    setError("");
    try {
      const res = await fn();
      setGameState(res.data.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Có lỗi xảy ra."));
    } finally {
      setAction(false);
    }
  }, []);

  // ── Auto-close question when timer expires (client-side fallback) ────────────
  useEffect(() => {
    const q = gameState?.current_round?.current_question;
    if (!q || q.status !== "open" || !q.opened_at) return;

    const remaining = new Date(q.opened_at).getTime() + q.time_limit_seconds * 1000 - Date.now();
    if (remaining <= 0) { act(() => closeQuestion(id)); return; }

    const timer = setTimeout(() => act(() => closeQuestion(id)), remaining);
    return () => clearTimeout(timer);
  }, [
    gameState?.current_round?.current_question?.round_question_id,
    gameState?.current_round?.current_question?.status,
    act, id,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <p className="text-gray-500">Không tìm thấy game.</p>
      </div>
    );
  }

  const round       = gameState.current_round;
  const question    = round?.current_question ?? null;
  const teams       = gameState.teams;
  const submissions = question?.team_submissions ?? [];

  const isLastRound    = !!round && round.round_number === gameState.rounds_total;
  const canStartGame   = gameState.status === "pending";
  const canStartRound  = gameState.status === "active" && (!round || round.status === "finished");
  const canCloseQ      = question?.status === "open";
  const canOpenNext    = question?.status === "closed" && round && round.questions_done < round.total_questions;
  const canFinishRound = !isLastRound && !!round && round.status === "active" && question?.status === "closed";
  const canFinishGame  = gameState.status === "active";

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-20">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/admin/rooms")}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-bold">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div>
                  <h1 className="text-2xl font-black text-gray-900">{gameState.name}</h1>
                  <p className="text-sm text-gray-500 font-mono">{gameState.access_code}</p>
                </div>
              </div>
              <StatusBadge status={gameState.status} />
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Status cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatusCard
                icon={<Trophy size={20} />}
                label="Round"
                value={round ? `${round.round_number} / ${gameState.rounds_total}` : `– / ${gameState.rounds_total}`}
                color="bg-purple-50 text-purple-600"
              />
              <StatusCard
                icon={<Users size={20} />}
                label="Teams"
                value={`${teams.length} / 30`}
                color="bg-blue-50 text-blue-600"
              />
              <StatusCard
                icon={<CheckCircle size={20} />}
                label="Questions Done"
                value={round ? `${round.questions_done} / ${round.total_questions}` : "– / –"}
                color="bg-green-50 text-green-600"
              />
              <StatusCard
                icon={<Clock size={20} />}
                label="Question"
                value={question?.status ?? "—"}
                color={question?.status === "open" ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600"}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question panel + controls */}
              <div className="lg:col-span-2 space-y-6">

                {/* Question display */}
                <motion.div
                  key={question?.round_question_id ?? "empty"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                >
                  {question ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-gray-400 font-bold">
                          Question {question.order_number} of {round?.total_questions}
                        </span>
                        {question.status === "open" && question.opened_at && (
                          <QuestionTimer
                            openedAt={question.opened_at}
                            limitSec={question.time_limit_seconds}
                            variant="admin"
                            urgentThreshold={5}
                          />
                        )}
                        {question.status === "closed" && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold uppercase">
                            Đã đóng
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-6">{question.content}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.answers.map((ans, i) => (
                          <div
                            key={ans.id}
                            className={`p-4 rounded-xl border ${
                              ans.is_correct ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                {LABELS[i]}
                              </span>
                              <span className="text-sm font-medium text-gray-700 flex-1">{ans.content}</span>
                              {ans.is_correct && <CheckCircle className="text-green-500 shrink-0" size={18} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-bold">
                        {round ? "Chờ mở câu hỏi..." : "Chưa có vòng đấu nào đang diễn ra"}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                    Điều khiển game
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {canStartGame   && <CtrlBtn color="bg-indigo-500" icon={<Monitor size={16} />}     label="Hiển thị màn hình chờ" loading={actionLoading} onClick={handleReveal} />}
                    {canStartGame   && <CtrlBtn color="bg-green-600"  icon={<Play size={16} />}        label="Bắt đầu game"   loading={actionLoading} onClick={() => act(() => startGame(id))} />}
                    {canStartRound  && <CtrlBtn color="bg-primary"    icon={<Play size={16} />}        label="Bắt đầu vòng"   loading={actionLoading} onClick={() => act(() => startRound(id))} />}
                    {canCloseQ      && <CtrlBtn color="bg-red-500"    icon={<Pause size={16} />}       label="Đóng câu hỏi"   loading={actionLoading} onClick={() => act(() => closeQuestion(id))} />}
                    {canOpenNext    && <CtrlBtn color="bg-blue-500"   icon={<SkipForward size={16} />} label="Câu tiếp theo"  loading={actionLoading} onClick={() => act(() => openQuestion(id))} />}
                    {canFinishRound && <CtrlBtn color="bg-gray-800"   icon={<Trophy size={16} />}      label="Kết thúc vòng"  loading={actionLoading} onClick={() => act(() => finishRound(id))} />}
                    {canFinishGame  && <CtrlBtn color="bg-secondary"  icon={<Trophy size={16} />}      label="Kết thúc game"  loading={actionLoading} onClick={() => act(() => finishGame(id))} />}
                    {gameState.status === "finished" && (
                      <span className="text-sm font-bold text-gray-400 self-center">Game đã kết thúc</span>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Live submission sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      {question ? "Trả lời hiện tại" : "Đội tham gia"}
                    </h3>
                    <div className="flex items-center gap-1 text-green-500">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold">LIVE</span>
                    </div>
                  </div>

                  {question ? (
                    <div className="space-y-2">
                      {submissions.map((s) => (
                        <div
                          key={s.team_id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm ${
                            s.submitted
                              ? s.is_correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-100"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <span className="font-bold text-gray-800 truncate">{s.team_name}</span>
                          {s.submitted ? (
                            s.is_correct !== null ? (
                              s.is_correct
                                ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                                : <XCircle size={16} className="text-red-400 shrink-0" />
                            ) : (
                              <span className="text-xs text-gray-500 font-bold">✓</span>
                            )
                          ) : (
                            <Clock size={14} className="text-gray-300 shrink-0" />
                          )}
                        </div>
                      ))}
                      {submissions.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Chưa có đội nào trả lời</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teams.map((t) => (
                        <div key={t.id} className="px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                          <span className="text-sm font-bold text-gray-700">{t.name}</span>
                        </div>
                      ))}
                      {teams.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Chưa có đội nào</p>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <GridBg size={40} />
    </div>
  );
}

// ── Pure sub-components (memo prevents re-renders from parent polling) ─────────

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
      status === "active"   ? "bg-green-100 text-green-700"  :
      status === "finished" ? "bg-gray-200 text-gray-500"    :
      "bg-yellow-100 text-yellow-700"
    }`}>
      {status}
    </span>
  );
});

const StatusCard = memo(function StatusCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
});

const CtrlBtn = memo(function CtrlBtn({
  color, icon, label, loading, onClick,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 ${color} text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {label}
    </button>
  );
});
