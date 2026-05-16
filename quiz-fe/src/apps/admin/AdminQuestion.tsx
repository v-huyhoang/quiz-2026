import { useState } from "react";
import { Plus, Trash2, CheckCircle, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import type { Question } from "../../type/question";

export const AdminQuestion = () => {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      text: "What does HTML stand for?",
      totalTime: 30,
      category: "Web Development",
      options: [
        { id: "a", text: "HyperText Markup Language", isCorrect: true },
        { id: "b", text: "HighText Machine Language" },
        { id: "c", text: "HyperText Modern Language" },
        { id: "d", text: "HyperTransfer Markup Language" },
      ],
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Question Bank</h3>
          <p className="text-sm text-gray-500">
            Manage all questions for your quizzes
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
        >
          <Plus size={18} />
          ADD QUESTION
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {questions.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm group relative"
          >
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                  {q.category}
                </span>
                <span className="text-xs text-gray-400 font-bold">
                  {q.totalTime}s Limit
                </span>
              </div>
              <button className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-4">{q.text}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`p-3 rounded-lg border flex justify-between items-center ${
                    opt.isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${opt.isCorrect ? "text-green-700" : "text-gray-600"}`}
                  >
                    {opt.text}
                  </span>
                  {opt.isCorrect && (
                    <CheckCircle className="text-green-500" size={16} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="text-primary" size={32} />
              <div>
                <h3 className="text-2xl font-black text-gray-900">
                  Create Question
                </h3>
                <p className="text-sm text-gray-400 lowercase tracking-widest font-bold">
                  NEW CHALLENGE ENTRY
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Question Content
                </label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Category
                  </label>
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
                    placeholder="e.g. General"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Timer (Seconds)
                  </label>
                  <input
                    type="number"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Options (Mark correct answer)
                </label>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="correct"
                      className="w-5 h-5 accent-primary"
                    />
                    <input
                      type="text"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
                      placeholder={`Option ${i}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                  Save Question
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
