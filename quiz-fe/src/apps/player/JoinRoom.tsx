import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Users, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "../../store/authStore";
import { joinRoom } from "../../services/roomService";
import backgroundImage from "../../assets/background.png";
import logoImage from "../../assets/logo.png";

export default function JoinRoom() {
  const [searchParams] = useSearchParams();
  const roomCodeFromUrl = searchParams.get("room") ?? "";
  const [step, setStep] = useState<1 | 2>(roomCodeFromUrl ? 2 : 1);
  const [roomCode, setRoomCode] = useState(roomCodeFromUrl);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError("Vui lòng nhập mã phòng.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      return handleNextStep(e);
    }

    const trimmedTeam = teamName.trim();
    const trimmedCode = roomCode.trim();

    if (!trimmedTeam || !trimmedCode) {
      setError("Vui lòng nhập mã phòng và tên đội.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await joinRoom(trimmedCode, trimmedTeam);
      const payload = res.data.data;

      setAuth({
        token: payload.token,
        teamId: payload.team_id,
        teamName: payload.team_name,
        gameId: payload.game_id,
        role: "player",
      });

      navigate("/player/waiting");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number; data?: { message?: string } } };
      const status = axiosErr?.response?.status;
      const message = axiosErr?.response?.data?.message;
      if (status === 404) setError("Mã phòng không tồn tại. Vui lòng kiểm tra lại.");
      else if (status === 409) setError("Phòng đã đầy (tối đa 16 đội).");
      else if (status === 422) setError(message ?? "Tên đội đã được dùng. Vui lòng chọn tên khác.");
      else setError("Không thể vào phòng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center p-4"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
     >
      {/* Logo - top */}
      <img
        src={logoImage}
        alt="Logo"
        className="h-16 w-auto object-contain drop-shadow-md"
      />

      {/* Form - center */}
      <div className="flex-1 flex items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30"
            >
              <Users size={32} className="text-white" />
            </motion.div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Tham gia phòng
            </h1>
            {step === 1 && (
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Vui lòng nhập mã phòng hoặc quét QR để tiếp tục
              </p>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-5">
                {/* Room Code */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Mã phòng
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value.toUpperCase());
                      if (error) setError("");
                    }}
                    placeholder="Ví dụ: XYZ123"
                    maxLength={10}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50
                              text-gray-900 font-bold text-lg text-center tracking-widest uppercase
                              focus:outline-none focus:border-primary focus:bg-white transition-all
                              disabled:opacity-50 disabled:cursor-not-allowed"
                    autoFocus
                  />
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                      <p className="text-red-600 text-sm font-semibold">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={!roomCode.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-3
                            bg-primary text-white font-black text-lg py-4 rounded-xl
                            hover:bg-primary/90 transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tiếp tục
                  <ArrowRight size={20} />
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-5">
                {/* Room Code Readonly */}
                <div className="flex items-center justify-between bg-primary/5 px-4 py-3 rounded-xl border border-primary/10">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">
                      Mã phòng
                    </p>
                    <p className="text-xl font-black text-primary font-mono leading-none">
                      {roomCode}
                    </p>
                  </div>
                  {!roomCodeFromUrl && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm font-bold text-primary/70 hover:text-primary transition-colors uppercase tracking-wider"
                    >
                      Đổi mã
                    </button>
                  )}
                </div>

                {/* Team Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Tên đội của bạn
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Nhập tên đội..."
                    maxLength={50}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50
                            text-gray-900 font-semibold text-lg
                            focus:outline-none focus:border-primary focus:bg-white transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    autoFocus={!!roomCodeFromUrl}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">Tối đa 50 ký tự</span>
                    <span
                      className={`text-xs font-bold ${teamName.length > 45 ? "text-secondary" : "text-gray-300"}`}
                    >
                      {teamName.length}/50
                    </span>
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                      <p className="text-red-600 text-sm font-semibold">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading || !teamName.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-3
                          bg-primary text-white font-black text-lg py-4 rounded-xl
                          hover:bg-primary/90 transition-all
                          disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Đang vào phòng...
                    </>
                  ) : (
                    <>
                      Vào phòng
                      <ArrowRight size={20} />
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Quét QR code từ màn hình để tham gia tự động
          </p>
        </motion.div>
      </div>
    </div>
  );
}
