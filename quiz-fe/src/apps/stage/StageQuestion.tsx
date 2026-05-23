import { Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function StageQuestion() {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const question = {
    text: "In computing, what does the acronym 'API' stand for?",
    category: "Web Development",
    number: 4,
    total: 10,
    options: [
      { id: "a", text: "Application Programming Interface" },
      { id: "b", text: "Automated Process Integration" },
      { id: "c", text: "Advanced Protocol Interaction" },
      { id: "d", text: "Algorithmic Performance Index" },
    ],
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-4 py-2 rounded-full">
              {question.category}
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              QUESTION {question.number} / {question.total}
            </span>
          </div>
          <div
            className={`flex items-center gap-3 font-mono text-4xl font-black px-8 py-4 rounded-2xl border shadow-lg transition-all ${
              timeLeft <= 10
                ? "text-red-500 border-red-300 bg-red-50"
                : "text-secondary border-gray-200 bg-white"
            }`}
          >
            <Timer size={32} />
            0:{timeLeft.toString().padStart(2, "0")}
          </div>
        </div>

        {/* Question */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-tight">
            {question.text}
          </h1>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
        >
          {question.options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white border-4 border-gray-200 rounded-2xl p-8 flex items-center gap-6 shadow-lg"
            >
              <span className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-3xl font-black text-gray-600 shrink-0">
                {option.id.toUpperCase()}
              </span>
              <span className="text-2xl md:text-3xl font-bold text-gray-900">
                {option.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle animated background */}
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
