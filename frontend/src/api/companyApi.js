// frontend/src/api/companyApi.js
import axiosClient from "./axiosClient";

export const companyApi = {
  getAll() {
    return axiosClient.get("/companies");
  },
  create(formData) {
    // formData = FormData
    return axiosClient.post("/companies", formData);
  },
};
