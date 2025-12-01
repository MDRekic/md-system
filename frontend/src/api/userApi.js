// frontend/src/api/userApi.js
import axiosClient from "./axiosClient";

export const userApi = {
  getTechnicians() {
    return axiosClient.get("/users");
  },
  createTechnician(data) {
    return axiosClient.post("/users/technicians", data);
  },
};
