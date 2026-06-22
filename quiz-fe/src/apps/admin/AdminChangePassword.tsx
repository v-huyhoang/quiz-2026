import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
} from "lucide-react";
import { changePassword } from "../../services/authService";

export default function AdminChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const currentPasswordError =
    touched.currentPassword && currentPassword.length < 6
      ? "Mật khẩu hiện tại tối thiểu 6 ký tự"
      : "";

  const newPasswordError =
    touched.newPassword && newPassword.length < 6
      ? "Mật khẩu mới tối thiểu 6 ký tự"
      : "";

  const confirmPasswordError =
    touched.confirmPassword && confirmPassword !== newPassword
      ? "Mật khẩu xác nhận không khớp"
      : touched.confirmPassword && confirmPassword.length < 6
        ? "Mật khẩu xác nhận tối thiểu 6 ký tự"
        : "";

  const canSubmit =
    currentPassword.length >= 6 &&
    newPassword.length >= 6 &&
    confirmPassword === newPassword &&
    !loading;

  const inputClass =
    "w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      );

      setSuccess(true);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
        };
      };

      const msg = axiosErr?.response?.data?.message;
      const errors = axiosErr?.response?.data?.errors;

      if (errors?.current_password) {
        setError(errors.current_password[0]);
      } else {
        setError(msg ?? "Đổi mật khẩu thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-black text-gray-900 mb-1">
          Đổi mật khẩu
        </h2>

        <p className="text-gray-500 text-sm">
          Cập nhật thông tin bảo mật tài khoản quản trị
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Lock size={22} />
            </div>

            <div>
              <h3 className="font-black text-gray-900">
                Thay đổi mật khẩu
              </h3>

              <p className="text-sm text-gray-500">
                Đảm bảo tài khoản của bạn luôn được bảo mật
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
          >
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu hiện tại
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={
                    showCurrentPassword ? "text" : "password"
                  }
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setError("");
                  }}
                  onBlur={() =>
                    setTouched((t) => ({
                      ...t,
                      currentPassword: true,
                    }))
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={loading}
                  className={inputClass}
                />

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() =>
                    setShowCurrentPassword((v) => !v)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {currentPasswordError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {currentPasswordError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu mới
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  onBlur={() =>
                    setTouched((t) => ({
                      ...t,
                      newPassword: true,
                    }))
                  }
                  placeholder="Nhập mật khẩu mới"
                  disabled={loading}
                  className={inputClass}
                />

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() =>
                    setShowNewPassword((v) => !v)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {newPasswordError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {newPasswordError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Xác nhận mật khẩu mới
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  onBlur={() =>
                    setTouched((t) => ({
                      ...t,
                      confirmPassword: true,
                    }))
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={loading}
                  className={inputClass}
                />

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() =>
                    setShowConfirmPassword((v) => !v)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {confirmPasswordError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {confirmPasswordError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle
                    size={16}
                    className="text-red-500"
                  />

                  <p className="text-red-600 text-sm font-medium">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl"
                >
                  <CheckCircle
                    size={16}
                    className="text-green-600"
                  />

                  <p className="text-green-600 text-sm font-medium">
                    Đổi mật khẩu thành công!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Đang xử lý...
                </span>
              ) : (
                "Đổi mật khẩu"
              )}
            </button>
          </form>
        </motion.div>

        {/* Security Guide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit"
        >
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <Shield size={20} />
          </div>

          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
            Bảo mật tài khoản
          </h3>

          <ul className="space-y-3">
            <li className="text-sm text-gray-600">
              • Mật khẩu tối thiểu 8 ký tự
            </li>

            <li className="text-sm text-gray-600">
              • Kết hợp chữ hoa, chữ thường và số
            </li>

            <li className="text-sm text-gray-600">
              • Không sử dụng thông tin cá nhân
            </li>

            <li className="text-sm text-gray-600">
              • Thay đổi định kỳ để tăng bảo mật
            </li>

            <li className="text-sm text-gray-600">
              • Không chia sẻ mật khẩu cho người khác
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}