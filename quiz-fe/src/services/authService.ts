import { api } from "./api";
import type { ApiResponse } from "../type/api";

export interface AdminLoginResponse {
  token: string;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

/** Admin login */
export const adminLogin = (email: string, password: string) =>
  api.post<ApiResponse<AdminLoginResponse>>("/admin/login", { email, password });

export const adminLogout = () =>
  api.post<ApiResponse<null>>("/admin/logout");

export const changePassword = (currentPassword: string, newPassword: string, confirmPassword: string) =>
  api.post<ApiResponse<null>>("/admin/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
