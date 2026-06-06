import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  Layout,
  Clock,
  Hash,
  QrCode,
  Copy,
  CheckCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Dices,
  ListChecks,
  Trash2,
  Eye,
  Trophy,
  Medal,
  Timer,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminRoomDetail from "./AdminRoomDetail";
import { QRCodeSVG } from "qrcode.react";
import type {
  Room,
  RoundQuestionMap,
  FormState,
  CreateRoomPayload,
} from "../../type/room";
import { createRoom, getRooms, deleteRoom } from "../../services/roomService";
import { getQuestions } from "../../services/questionService";
import {
  getPublicGameState,
  getRoundResults,
  type GameTeam,
  type RoundResult,
} from "../../services/gameService";
import QuestionTypeBadge from "../../components/ui/QuestionTypeBadge";

const APP_URL = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

type ModalStep = "step1_config" | "step2_questions" | "step3_qr" | "detail";

export const AdminRoom = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>("step1_config");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [questionBank, setQuestionBank] = useState<any[]>([]);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");

  const [resultsRoom, setResultsRoom] = useState<Room | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsRoundData, setResultsRoundData] = useState<RoundResult[]>([]);
  const [resultsTeams, setResultsTeams] = useState<GameTeam[]>([]);
  const [activeResultsRound, setActiveResultsRound] = useState(1);

  const [newRoomCode, setNewRoomCode] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const backdropMouseDown = useRef(false);

  useEffect(() => {
    fetchRooms();
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (isOpen) fetchQuestions();
  }, [isOpen]);

  const fetchRooms = async () => {
    try {
      setFetching(true);
      const { data } = await getRooms();
      const roomsData = data.data.map((room) => ({
        id: String(room.id),
        name: room.name,
        rounds: room.rounds,
        questionsPerRound: room.questions_per_round,
        status: room.status,
        accessCode: room.access_code,
        questionMode: room.question_mode,
      }));
      setRooms(roomsData);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setFetchingQuestions(true);
      const { data } = await getQuestions();
      console.log("🚀 ~ fetchQuestions ~ data:", data);
      const questionsData = data.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
      }));
      setQuestionBank(questionsData);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setQuestionBank([]);
    } finally {
      setFetchingQuestions(false);
    }
  };

  const [form, setForm] = useState<FormState>({
    name: "",
    rounds: "3",
    questionsPerRound: "10",
    accessCode: "",
    questionMode: "random",
  });

  const [manualSelection, setManualSelection] = useState<RoundQuestionMap>({});
  const [activeRoundTab, setActiveRoundTab] = useState(1);

  const joinUrl = `${APP_URL}/join?room=${newRoomCode}`;

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm((f) => ({ ...f, accessCode: code }));
  };

  const handleNextStep1 = () => {
    if (
      !form.name.trim() ||
      !form.accessCode.trim() ||
      !form.rounds ||
      !form.questionsPerRound
    )
      return;

    // Initialize empty manual array for the entered number of rounds
    const roundsCount = Number(form.rounds);
    setManualSelection((prev) => {
      const nextMap: RoundQuestionMap = {};
      for (let i = 1; i <= roundsCount; i++) {
        nextMap[i] = prev[i] || [];
      }
      return nextMap;
    });
    setActiveRoundTab(1);
    setStep("step2_questions");
  };

  const toggleQuestionSelection = (qId: number) => {
    setManualSelection((prev) => {
      const selectedIds = prev[activeRoundTab] || [];
      const exists = selectedIds.includes(qId);
      if (exists) {
        return {
          ...prev,
          [activeRoundTab]: selectedIds.filter((id) => id !== qId),
        };
      } else {
        if (selectedIds.length >= Number(form.questionsPerRound)) return prev;
        return { ...prev, [activeRoundTab]: [...selectedIds, qId] };
      }
    });
  };

  const handleCreate = async () => {
    setLoading(true);
    setCreateError("");
    try {
      const payload: CreateRoomPayload = {
        name: form.name,
        rounds: Number(form.rounds),
        questions_per_round: Number(form.questionsPerRound),
        access_code: form.accessCode,
        question_mode: form.questionMode,
      };
      if (form.questionMode === "manual") {
        payload.round_questions = Object.entries(manualSelection).map(
          ([roundStr, qIds]) => ({
            round_number: Number(roundStr),
            question_ids: qIds,
          }),
        );
      }
      const res = await createRoom(payload);
      setNewRoomCode(res.data.data.access_code);
      setNewRoomName(res.data.data.name);
      await fetchRooms();
      setStep("step3_qr");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      const msg = axiosErr?.response?.data?.message;
      if (errors) {
        const first = Object.values(errors)[0]?.[0];
        setCreateError(first ?? msg ?? "Tạo phòng thất bại. Vui lòng thử lại.");
      } else {
        setCreateError(msg ?? "Tạo phòng thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = joinUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("Failed to delete room. Please try again.");
    }
  };

  const handleOpenDetail = (roomId: string) => {
    setSelectedRoomId(roomId);
    setStep("detail");
    setIsOpen(true);
  };

  const handleOpenResults = async (room: Room) => {
    setResultsRoom(room);
    setResultsLoading(true);
    setResultsRoundData([]);
    setResultsTeams([]);
    setActiveResultsRound(1);
    try {
      const [stateRes, roundRes] = await Promise.all([
        getPublicGameState(room.id),
        getRoundResults(room.id),
      ]);
      setResultsTeams(stateRes.data.data?.teams ?? []);
      setResultsRoundData(roundRes.data.data ?? []);
      if ((roundRes.data.data ?? []).length > 0) {
        setActiveResultsRound(roundRes.data.data![0].round_number);
      }
    } catch (err) {
      console.error("Failed to fetch game results:", err);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleCloseResults = () => {
    setResultsRoom(null);
    setResultsRoundData([]);
    setResultsTeams([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("step1_config");
    setForm({
      name: "",
      rounds: "3",
      questionsPerRound: "10",
      accessCode: "",
      questionMode: "random",
    });
    setCopied(false);
    setManualSelection({});
    setCreateError("");
    setSelectedRoomId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Rooms & Sessions</h3>
          <p className="text-sm text-gray-500">
            Quản lý phòng thi và sinh QR code cho người chơi
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
        >
          <Plus size={18} />
          TẠO PHÒNG
        </button>
      </div>

      {/* Room list */}
      {fetching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <QrCode size={32} className="opacity-30" />
          <p className="text-sm font-medium">Chưa có phòng nào. Hãy tạo phòng mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${room.status === "active"
                      ? "bg-green-100 text-green-600"
                      : room.status === "finished"
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {room.status}
                  </span>
                  <span className="text-xl font-black text-primary font-mono">
                    {room.accessCode}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {room.name}
                </h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                  {room.questionMode === "random" ? (
                    <Dices size={14} />
                  ) : (
                    <ListChecks size={14} />
                  )}{" "}
                  Mode: {room.questionMode}
                </p>
              </div>

              <div className="p-6 grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                    <Layout size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rounds</p>
                    <p className="text-lg font-bold text-gray-900">{room.rounds}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                    <Hash size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Questions</p>
                    <p className="text-lg font-bold text-gray-900">{room.questionsPerRound} / round</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex gap-3">
                {room.status !== "finished" ? (
                  <>
                    <button
                      onClick={() => navigate(`/admin/game-control/${room.id}`)}
                      className="flex-1 py-2 bg-primary text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-primary/90 transition-all"
                    >
                      Điều khiển
                    </button>
                    <button
                      onClick={() => window.open(`/stage/waiting?room=${room.accessCode}`, "_blank")}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-purple-700 transition-all"
                    >
                      Màn hình stage
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenResults(room)}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy size={14} /> Xem kết quả
                  </button>
                )}
                <button
                  onClick={() => handleOpenDetail(room.id)}
                  className="py-2 px-3 border border-gray-200 text-gray-500 rounded-lg hover:bg-white transition-all"
                  title="Xem chi tiết"
                >
                  <Eye size={16} />
                </button>
                {(room.status === "pending" || room.status === "finished") && (
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="py-2 px-3 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all"
                    title="Xóa phòng"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onMouseDown={(e) => {
              backdropMouseDown.current = e.target === e.currentTarget;
            }}
            onMouseUp={(e) => {
              if (
                backdropMouseDown.current &&
                e.target === e.currentTarget
              ) {
                handleClose();
              }

              backdropMouseDown.current = false;
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white w-full rounded-2xl p-8 shadow-2xl transition-all duration-300 overflow-y-auto max-h-[90vh] ${step === "step2_questions"
                ? "max-w-3xl"
                : step === "detail"
                  ? "max-w-4xl"
                  : "max-w-xl"
                }`}
            >
              <AnimatePresence mode="wait">
                {/* ── Step 1: Config ─────────────────────────────────────── */}
                {step === "step1_config" && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Users className="text-primary" size={32} />
                        <div>
                          <h3 className="text-2xl font-black text-gray-900">New Quiz Room</h3>
                          <p className="text-sm text-gray-400 font-bold tracking-widest uppercase">
                            Step 1: Configuration
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Tên phòng
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                          placeholder="vd. Championship Finals 2026"
                          autoFocus
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> Rounds
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={form.rounds}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, rounds: e.target.value }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Hash size={10} /> Q / Round
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={form.questionsPerRound}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                questionsPerRound: e.target.value,
                              }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Access Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={form.accessCode}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                accessCode: e.target.value.toUpperCase(),
                              }))
                            }
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-lg font-mono font-black focus:outline-none focus:border-primary tracking-widest"
                            placeholder="AUTO"
                            maxLength={10}
                          />
                          <button
                            type="button"
                            onClick={generateCode}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors"
                          >
                            Tạo mã
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-2">
                        <button
                          onClick={handleClose}
                          className="flex-1 py-4 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleNextStep1}
                          disabled={
                            !form.name.trim() || !form.accessCode.trim()
                          }
                          className="flex-1 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          Tiếp tục <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Questions ──────────────────────────────────── */}
                {step === "step2_questions" && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Layout className="text-primary" size={32} />
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">Question Selection</h3>
                        <p className="text-sm text-gray-400 font-bold tracking-widest uppercase">
                          Step 2: Assign Questions
                        </p>
                      </div>
                    </div>

                    {/* Mode selector */}
                    <div className="flex gap-4 mb-6">
                      <button
                        onClick={() =>
                          setForm((f) => ({ ...f, questionMode: "random" }))
                        }
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${form.questionMode === "random"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                          }`}
                      >
                        <Dices size={24} />
                        <span className="font-bold uppercase tracking-widest text-xs">
                          Ngẫu nhiên
                        </span>
                        <span className="text-xs text-center opacity-80 mt-1 lowercase">
                          Hệ thống chọn lúc bắt đầu round
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          setForm((f) => ({ ...f, questionMode: "manual" }))
                        }
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${form.questionMode === "manual"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                          }`}
                      >
                        <ListChecks size={24} />
                        <span className="font-bold uppercase tracking-widest text-xs">
                          Tự chọn
                        </span>
                        <span className="text-xs text-center opacity-80 mt-1 lowercase">
                          Chỉ định từng câu hỏi cho từng round
                        </span>
                      </button>
                    </div>

                    {/* Manual UI */}
                    <AnimatePresence>
                      {form.questionMode === "manual" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-6 border-t border-gray-100 pt-6"
                        >
                          {/* Round tabs */}
                          <div className="w-1/3 flex flex-col gap-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                              Chọn Round
                            </p>
                            {Array.from({ length: Number(form.rounds) }).map(
                              (_, idx) => {
                                const rNum = idx + 1;
                                const selectedCount =
                                  manualSelection[rNum]?.length || 0;
                                const maxQuestions = Number(
                                  form.questionsPerRound,
                                );
                                return (
                                  <button
                                    key={rNum}
                                    onClick={() => setActiveRoundTab(rNum)}
                                    className={`p-3 rounded-xl border flex justify-between items-center transition-all ${activeRoundTab === rNum
                                      ? "bg-primary text-white border-primary shadow-md"
                                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                      }`}
                                  >
                                    <span className="font-bold text-sm">
                                      Round {rNum}
                                    </span>
                                    <span
                                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeRoundTab === rNum
                                        ? "bg-white/20"
                                        : "bg-white border border-gray-200"
                                        }`}
                                    >
                                      {selectedCount}/{maxQuestions}
                                    </span>
                                  </button>
                                );
                              },
                            )}
                          </div>

                          {/* Question list picker */}
                          <div className="w-2/3 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden flex flex-col h-[300px]">
                            <div className="p-3 border-b border-gray-200 bg-white">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Ngân hàng câu hỏi
                              </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                              {fetchingQuestions ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2
                                    className="animate-spin text-primary"
                                    size={24}
                                  />
                                </div>
                              ) : questionBank.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                  Không có câu hỏi nào
                                </div>
                              ) : (
                                questionBank.map((q) => {
                                  const isSelected = manualSelection[
                                    activeRoundTab
                                  ]?.includes(q.id);
                                  return (
                                    <div
                                      key={q.id}
                                      onClick={() =>
                                        toggleQuestionSelection(q.id)
                                      }
                                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-transparent bg-white hover:border-gray-200"
                                        }`}
                                    >
                                      <div
                                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 ${isSelected
                                          ? "bg-primary border-primary text-white"
                                          : "border-gray-300"
                                          }`}
                                      >
                                        {isSelected && <CheckCheck size={12} />}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {q.text}
                                        </p>
                                        <QuestionTypeBadge type={q.type} />
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {createError && (
                      <p className="mt-4 text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                        {createError}
                      </p>
                    )}

                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => { setStep("step1_config"); setCreateError(""); }}
                        className="py-4 px-6 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all text-xs flex items-center gap-2 uppercase tracking-widest"
                      >
                        <ArrowLeft size={16} /> Quay lại
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="flex-1 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Đang
                            tạo...
                          </>
                        ) : (
                          "Hoàn tất tạo phòng"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: View QR Code ──────────────────────────────────── */}
                {step === "step3_qr" && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <QrCode className="text-primary" size={24} />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900">
                        {newRoomName}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Chia sẻ QR to người chơi tham gia
                      </p>
                    </div>

                    <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                      <QRCodeSVG
                        value={joinUrl}
                        size={200}
                        fgColor="#006876"
                        level="M"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-primary/5 px-5 py-2 rounded-full">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Mã phòng:
                      </span>
                      <span className="text-xl font-black text-primary font-mono tracking-widest">
                        {newRoomCode}
                      </span>
                    </div>

                    <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <p className="flex-1 text-xs text-gray-500 font-mono truncate">
                        {joinUrl}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/70 transition-colors"
                      >
                        {copied ? (
                          <>
                            <CheckCheck size={14} /> Đã copy
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm uppercase tracking-widest"
                    >
                      Đóng
                    </button>
                  </motion.div>
                )}

                {/* ── Detail: Room Details ──────────────────────────────────── */}
                {step === "detail" && selectedRoomId && (
                  <AdminRoomDetail
                    roomId={selectedRoomId}
                    onClose={handleClose}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {resultsRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onMouseDown={(e) => {
              backdropMouseDown.current = e.target === e.currentTarget;
            }}
            onMouseUp={(e) => {
              if (
                backdropMouseDown.current &&
                e.target === e.currentTarget
              ) {
                handleCloseResults();
              }

              backdropMouseDown.current = false;
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Trophy className="text-amber-500" size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{resultsRoom.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kết quả game</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseResults}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-7 flex flex-col gap-7">
                {resultsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                  </div>
                ) : (
                  <>
                    {/* Teams list */}
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Users size={12} /> Danh sách đội tham gia ({resultsTeams.length})
                      </p>
                      {resultsTeams.length === 0 ? (
                        <p className="text-sm text-gray-400">Không có dữ liệu</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {resultsTeams.map((team) => (
                            <span
                              key={team.id}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold"
                            >
                              {team.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Per-round results */}
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Medal size={12} /> Top 5 theo từng round
                      </p>
                      {resultsRoundData.length === 0 ? (
                        <p className="text-sm text-gray-400">Không có dữ liệu</p>
                      ) : (
                        <>
                          {/* Round tabs */}
                          <div className="flex gap-2 mb-4">
                            {resultsRoundData.map((rd) => (
                              <button
                                key={rd.round_number}
                                onClick={() => setActiveResultsRound(rd.round_number)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeResultsRound === rd.round_number
                                  ? "bg-primary text-white shadow-sm"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                              >
                                Round {rd.round_number}
                              </button>
                            ))}
                          </div>
                          {/* Top 5 for active round */}
                          {resultsRoundData
                            .filter((rd) => rd.round_number === activeResultsRound)
                            .map((rd) => (
                              <div key={rd.round_number} className="flex flex-col gap-2">
                                {rd.top_teams.length === 0 ? (
                                  <p className="text-sm text-gray-400">Chưa có kết quả</p>
                                ) : (
                                  rd.top_teams.map((entry) => (
                                    <div
                                      key={entry.team_id}
                                      className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${entry.rank === 1
                                        ? "bg-amber-50 border-amber-200"
                                        : entry.rank === 2
                                          ? "bg-gray-50 border-gray-200"
                                          : entry.rank === 3
                                            ? "bg-orange-50 border-orange-200"
                                            : "bg-white border-gray-100"
                                        }`}
                                    >
                                      <span
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${entry.rank === 1
                                          ? "bg-amber-400 text-white"
                                          : entry.rank === 2
                                            ? "bg-gray-400 text-white"
                                            : entry.rank === 3
                                              ? "bg-orange-400 text-white"
                                              : "bg-gray-100 text-gray-500"
                                          }`}
                                      >
                                        {entry.rank}
                                      </span>
                                      <span className="flex-1 font-bold text-gray-800 text-sm">{entry.team_name}</span>
                                      <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                                        <CheckCheck size={13} />
                                        {entry.correct_count} đúng
                                      </div>
                                      <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                        <Timer size={13} />
                                        {entry.total_time_seconds}s
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-7 py-5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => window.open(`/stage/final?gameId=${resultsRoom.id}`, "_blank")}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Layout size={16} /> Hiển thị kết quả trên màn hình Stage
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
