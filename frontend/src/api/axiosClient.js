// frontend/src/api/axiosClient.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("comp4_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
