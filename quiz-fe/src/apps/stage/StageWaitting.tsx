import { Group, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function StageWaitting() {
  const navigate = useNavigate();

  const teams = [
    { name: "Team Alpha", ready: true },
    { name: "Neon Knights", ready: true },
    { name: "Cyber Punks", ready: true },
    { name: "Data Miners", ready: true },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-20">
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center gap-4 mb-12 w-full text-center relative overflow-hidden shadow-sm"
        >
          <div className="absolute inset-0 bg-primary-container/5 pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full bg-primary-container animate-ping"></div>
            <h1 className="text-2xl font-bold text-primary uppercase tracking-widest">
              Connected to Arena
            </h1>
          </div>
          <p className="text-gray-500 font-medium z-10">
            Waiting for admin to start...
          </p>
          <div className="w-full h-2 bg-gray-100 mt-4 rounded-full overflow-hidden z-10">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "33%" }}
              className="h-full bg-primary-container rounded-full"
            ></motion.div>
          </div>
        </motion.div>

        <div className="w-full flex flex-col gap-8">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-gray-900">Lobby Roster</h2>
            <div className="text-5xl font-black text-primary">
              8<span className="text-xl text-gray-300">/16</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((team, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border-2 border-primary-container p-4 rounded-lg flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate("/quiz")}
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                  <Group size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">
                    {team.name}
                  </p>
                  <p className="text-xs text-primary font-bold">Ready</p>
                </div>
              </motion.div>
            ))}

            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 rounded-lg flex items-center gap-4 opacity-50"
              >
                <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-300">
                  <UserPlus size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Empty Slot
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
