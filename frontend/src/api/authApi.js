import axiosClient from "./axiosClient";

export const authApi = {
  login(email, password) {
    return axiosClient.post("/auth/login", { email, password });
  },
};