import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "comp4_token";

const axiosClient = axios.create({
  baseURL: API_URL,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
