import axios from "axios";

// u produkciji će sve ići preko Nginx-a na /api
const API_URL = import.meta.env.VITE_API_URL || "/api";

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default axiosClient;
