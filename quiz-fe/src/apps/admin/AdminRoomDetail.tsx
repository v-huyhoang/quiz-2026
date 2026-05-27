import { motion } from "motion/react";
import { Users, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getRoomDetail } from "../../services/roomService";

interface AdminRoomDetailProps {
  roomId: string;
  onClose: () => void;
}

interface Question {
  id: number;
  content: string;
  time_limit_seconds: number;
}

interface RoundQuestion {
  id: number;
  order_number: number;
  status: string;
  question: Question;
}

interface Round {
  id: number;
  round_number: number;
  status: string;
  round_questions: RoundQuestion[];
}

interface RoomDetail {
  id: number;
  name: string;
  access_code: string;
  rounds: Round[];
  questions_per_round: number;
  status: string;
  question_mode: "manual" | "random";
}

const AdminRoomDetail = ({ roomId, onClose, }: AdminRoomDetailProps) => {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);

  const fetchedRef = useRef(false);

  const fetchDetail = async (id: string) => {
    try {
      setLoading(true);

      const data = await getRoomDetail(id);

      setDetail(data);

      setSelectedRound(null);
    } catch (error) {
      console.error("Failed to load room detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roomId || fetchedRef.current) return;

    fetchedRef.current = true;
    fetchDetail(roomId);
  }, [roomId]);

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="text-primary" size={32} />
        <div>
          <h3 className="text-2xl font-black text-gray-900">
            Chi tiết phòng
          </h3>
          <p className="text-sm text-gray-400">
            Thông tin chi tiết của phòng
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="animate-spin text-primary"
            size={28}
          />
        </div>
      ) : (
        <>
          {/* Room Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold">
                Tên phòng
              </p>
              <p className="font-bold text-lg text-gray-900">
                {detail?.name ?? "-"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold">
                Mã truy cập
              </p>
              <p className="font-bold text-lg text-primary font-mono">
                {detail?.access_code ?? "-"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold">
                Rounds
              </p>
              <p className="font-bold text-lg text-gray-900">
                {detail?.rounds?.length ?? "-"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold">
                Questions / Round
              </p>
              <p className="font-bold text-lg text-gray-900">
                {detail?.questions_per_round ?? "-"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold">
                Status
              </p>
              <p className="font-bold text-lg text-gray-900">
                {detail?.status ?? "-"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold">
                Question Mode
              </p>
              <p className="font-bold text-lg text-gray-900">
                {detail?.question_mode ?? "-"}
              </p>
            </div>
          </div>

          {/* Round List */}
          {detail?.rounds?.length ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-3">
                Danh sách Round
              </p>

              <div className="flex flex-col gap-2">
                {detail.rounds.map((round) => (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRound(round)}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 border transition-all ${selectedRound?.id === round.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-gray-200 bg-white hover:border-primary"
                      }`}
                  >
                    <span className="font-semibold">
                      Round {round.round_number}
                    </span>

                    <span className="text-sm text-gray-500">
                      {round.round_questions.length} câu hỏi
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Placeholder */}
          {!selectedRound && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <p className="text-gray-400 font-medium">
                Chọn một Round để xem danh sách câu hỏi
              </p>
            </div>
          )}

          {/* Selected Round */}
          {selectedRound && (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-primary text-lg">
                      Đang xem Round {selectedRound.round_number}
                    </h4>

                    <p className="text-sm text-gray-500">
                      {selectedRound.round_questions.length} câu hỏi
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-3">
                  {selectedRound.round_questions.map((rq) => (
                    <div
                      key={rq.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-primary">
                          ID: {rq.question.id}
                        </span>

                        <span className="text-sm text-gray-500">
                          {rq.question.time_limit_seconds}s
                        </span>
                      </div>

                      <p className="text-gray-800">
                        {rq.question.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Footer */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-200 rounded-lg font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm"
        >
          Đóng
        </button>
      </div>
    </motion.div>
  );
};

export default AdminRoomDetail;