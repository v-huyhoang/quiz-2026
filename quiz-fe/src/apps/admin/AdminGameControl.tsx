import { useState, useEffect } from "react";
import { Navbar } from "./parts/Navbar";
import { motion } from "motion/react";
import { Play, Pause, SkipForward, Trophy, Clock, Users, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { startGame } from "../../services/gameService";
import { useGameSocket } from "../../sockets/hooks/useGameSocket";
import { useGameStore } from "../../store/gameStore";
import { useCountdown } from "../../hooks/useCountdown";

// Mock data for demo
const MOCK_TEAMS = [
  { id: 1, name: "Team Alpha", score: 120, correct: 4, responseTime: 12.5, submitted: true },
  { id: 2, name: "Team Beta", score: 100, correct: 3, responseTime: 15.2, submitted: true },
  { id: 3, name: "Team Gamma", score: 90, correct: 3, responseTime: 18.1, submitted: false },
  { id: 4, name: "Team Delta", score: 80, correct: 2, responseTime: 20.3, submitted: true },
  { id: 5, name: "Team Epsilon", score: 70, correct: 2, responseTime: 22.0, submitted: false },
  { id: 6, name: "Team Zeta", score: 60, correct: 2, responseTime: 24.5, submitted: true },
];

export default function AdminGameControl() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const { 
    gameStatus: storeGameStatus, 
    roundStatus: storeRoundStatus,
    questionStatus: storeQuestionStatus,
    currentQuestion: storeQuestion 
  } = useGameStore();

  const gameStatus = storeGameStatus || "waiting";
  const roundStatus = storeRoundStatus || "waiting";
  const questionStatus = storeQuestionStatus || "waiting";

  const [currentRound] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(5);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Set gameId from URL parameter
  useEffect(() => {
    if (roomId) {
      setGameId(parseInt(roomId));
    }
  }, [roomId]);

  // Listen for socket events when gameId is set
  useGameSocket(gameId?.toString() || "");

  // Use countdown hook for timer
  const { timeLeft } = useCountdown({
    openedAt: storeQuestion?.openedAt,
    duration: storeQuestion?.timeLimit,
  });

  const handleStartGame = async () => {
    if (!gameId) {
      alert("Please select a game first");
      return;
    }

    if (storeGameStatus === "active") {
      alert("Game is already active");
      return;
    }

    setIsStarting(true);
    try {
      const response = await startGame({ game_id: gameId });
      if (!response.data.success) {
        alert(response.data.message || "Failed to start game");
      }
    } catch (error: any) {
      console.error("Failed to start game:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to start game. Please try again.";
      alert(errorMessage);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartRound = () => {
    // TODO: Call API to start round
  };

  const handleFinishRound = () => {
    setShowLeaderboard(true);
  };

  const handleOpenQuestion = () => {
    // TODO: Call API to open question
  };

  const handleCloseQuestion = () => {
    // TODO: Call API to close question
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      handleFinishRound();
    }
  };

  const handleBackToDashboard = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-20">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-bold">Back to Dashboard</span>
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div>
                  <h1 className="text-2xl font-black text-gray-900">Game Control</h1>
                  <p className="text-sm text-gray-500">Manage live quiz session</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  gameStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {gameStatus}
                </div>
              </div>
            </div>

            {/* Game Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatusCard
                icon={<Trophy size={20} />}
                label="Current Round"
                value={`${currentRound} / 3`}
                color="bg-purple-50 text-purple-600"
              />
              <StatusCard
                icon={<Users size={20} />}
                label="Teams Active"
                value="6 / 16"
                color="bg-blue-50 text-blue-600"
              />
              <StatusCard
                icon={<CheckCircle size={20} />}
                label="Questions Done"
                value={`${currentQuestion - 1} / ${totalQuestions}`}
                color="bg-green-50 text-green-600"
              />
              <StatusCard
                icon={<Clock size={20} />}
                label="Round Status"
                value={roundStatus}
                color={roundStatus === "active" ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600"}
              />
            </div>

            {/* Game ID Input */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                Game Selection
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2">Game ID</label>
                  <input
                    type="number"
                    value={gameId || ""}
                    onChange={(e) => setGameId(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Enter game ID"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                {gameStatus === "waiting" && (
                  <button
                    onClick={handleStartGame}
                    disabled={!gameId || isStarting}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isStarting ? (
                      <>
                        <Clock size={18} className="animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play size={18} />
                        Start Game
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question Control Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Question Display */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                        Quiz
                      </span>
                      <span className="text-xs text-gray-400 font-bold">
                        Question {currentQuestion} of {totalQuestions}
                      </span>
                    </div>
                    {questionStatus === "open" && (
                      <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full">
                        <Clock size={16} className="animate-pulse" />
                        <span className="text-sm font-black">{timeLeft}s</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-6">{storeQuestion?.content || "Waiting for question..."}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {storeQuestion?.options?.map((opt: any, idx: number) => (
                      <div
                        key={opt.id}
                        className="p-4 rounded-xl border bg-gray-50 border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                            {String.fromCharCode(97 + idx).toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{opt.content}</span>
                        </div>
                      </div>
                    )) || (
                      <div className="col-span-2 text-center text-gray-400 py-8">
                        Waiting for question...
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Control Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                    Game Controls
                  </h3>
                  
                  <div className="flex flex-wrap gap-3">
                    {roundStatus === "waiting" && (
                      <button
                        onClick={handleStartRound}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                      >
                        <Play size={18} />
                        Start Round
                      </button>
                    )}

                    {roundStatus === "active" && questionStatus === "waiting" && (
                      <button
                        onClick={handleOpenQuestion}
                        className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                      >
                        <Play size={18} />
                        Open Question
                      </button>
                    )}

                    {questionStatus === "open" && (
                      <button
                        onClick={handleCloseQuestion}
                        className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        <Pause size={18} />
                        Close Question
                      </button>
                    )}

                    {questionStatus === "closed" && currentQuestion < totalQuestions && (
                      <button
                        onClick={handleNextQuestion}
                        className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <SkipForward size={18} />
                        Next Question
                      </button>
                    )}

                    {roundStatus === "active" && (
                      <button
                        onClick={handleFinishRound}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                      >
                        <Trophy size={18} />
                        Finish Round
                      </button>
                    )}

                    <button
                      onClick={() => setShowLeaderboard(!showLeaderboard)}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                      <Trophy size={18} />
                      {showLeaderboard ? "Hide" : "Show"} Leaderboard
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Live Leaderboard */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                      Live Leaderboard
                    </h3>
                    <div className="flex items-center gap-1 text-green-500">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold">LIVE</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {MOCK_TEAMS.map((team, index) => (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-xl border ${
                          index === 0 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                              index === 0 ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-600"
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{team.name}</span>
                          </div>
                          <span className="text-lg font-black text-gray-900">{team.score}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-gray-500">
                            <span className="font-bold text-green-600">{team.correct}</span> correct
                          </span>
                          <span className="text-gray-500">
                            {team.responseTime}s avg
                          </span>
                          {team.submitted ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} />
                              Submitted
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400">
                              <XCircle size={12} />
                              Pending
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
        {label}
      </p>
    </div>
  );
}
