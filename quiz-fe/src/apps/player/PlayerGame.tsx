import { Timer, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "../../store/gameStore";
import { useGameSocket } from "../../sockets/hooks/useGameSocket";
import { useCountdown } from "../../hooks/useCountdown";
import { useAuthStore } from "../../store/authStore";

export default function PlayerGame() {
  const { currentQuestion } = useGameStore();
  const { gameId } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Listen for socket events
  useGameSocket(gameId?.toString() || "");

  // Use countdown hook for timer
  const { timeLeft } = useCountdown({
    openedAt: currentQuestion?.openedAt,
    duration: currentQuestion?.timeLimit,
  });

  // Reset selection/submitted when question changes
  useEffect(() => {
    if (currentQuestion) {
      setSelected(null);
      setSubmitted(false);
    }
  }, [currentQuestion]);

  const options = currentQuestion?.options.map((opt, idx) => ({
    id: String.fromCharCode(97 + idx),
    text: opt.content,
  })) || [];

  const handleSubmit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    // TODO: send to server here
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-3 py-1 rounded-full">
              QUESTION 4 / 10
            </span>
          </div>
          <div
            className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg border shadow-sm transition-colors ${
              timeLeft <= 10
                ? "text-red-500 border-red-200 bg-red-50"
                : "text-primary border-gray-200 bg-white"
            }`}
          >
            <Timer size={20} />
            0:{timeLeft.toString().padStart(2, "0")}
          </div>
        </div>

        {/* Question */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            {currentQuestion?.content || "Waiting for question..."}
          </h2>
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <motion.button
                key={option.id}
                whileTap={!submitted ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (submitted) return;
                  setSelected(option.id);
                }}
                disabled={submitted}
                className={`p-6 rounded-xl border-4 text-left transition-all relative overflow-hidden flex justify-between items-center
                  ${submitted ? "cursor-not-allowed" : "cursor-pointer"}
                  ${
                    isSelected
                      ? submitted
                        ? "border-primary bg-primary/5 opacity-80"
                        : "border-primary bg-primary/5 ring-4 ring-primary/10"
                      : submitted
                        ? "border-gray-100 bg-gray-50 opacity-40"
                        : "border-white bg-white hover:border-primary/20 shadow-sm"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border-2 ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "text-gray-400 border-gray-100"
                    }`}
                  >
                    {option.id.toUpperCase()}
                  </span>
                  <span
                    className={`font-bold text-lg ${isSelected ? "text-primary" : "text-gray-700"}`}
                  >
                    {option.text}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle className="text-primary shrink-0" size={24} />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Submit / Waiting */}
        <div className="mt-12 flex justify-center">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.button
                key="submit"
                onClick={handleSubmit}
                disabled={!selected}
                whileHover={selected ? { scale: 1.03 } : {}}
                whileTap={selected ? { scale: 0.97 } : {}}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative flex items-center gap-3 px-7 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase text-white overflow-hidden transition-all ${
                  selected
                    ? "bg-primary cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {/* shimmer sweep — only when active */}
                {selected && (
                  <span
                    className="pointer-events-none absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                    }}
                  />
                )}
                <CheckCircle size={18} className="relative z-10 shrink-0" />
                <span className="relative z-10">Submit</span>
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
                {/* Animated dots */}
                <span className="flex gap-1 ml-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
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
