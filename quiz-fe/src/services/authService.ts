import { api } from "./api";

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
  api.post<AdminLoginResponse>("/admin/login", { email, password });

export const adminLogout = () =>
  api.post("/admin/logout");
