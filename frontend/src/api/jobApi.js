// frontend/src/api/jobApi.js
import axiosClient from "./axiosClient";

export const jobApi = {
  // kalendar: dohvat naloga po datumu
  getJobs(params) {
    return axiosClient.get("/jobs", { params });
  },

  // tehničar odjavljuje nalog + upload fajlova
  completeJob(id, formData) {
    return axiosClient.post(`/jobs/${id}/complete`, formData);
  },

  // ADMIN: lista naloga sa statusom WAITING_REVIEW
  getPendingJobs() {
    return axiosClient.get("/jobs/pending");
  },

  // lista priloga za nalog
  getAttachments(jobId) {
    return axiosClient.get(`/jobs/${jobId}/attachments`);
  },

  // ADMIN: odobrava nalog
  approveJob(id, reason) {
    return axiosClient.post(`/jobs/${id}/approve`, { reason });
  },

  // ADMIN: odbija nalog
  rejectJob(id, reason) {
    return axiosClient.post(`/jobs/${id}/reject`, { reason });
  },
  createJob(data) {
  return axiosClient.post("/jobs", data);
},
 // ⬇⬇⬇ NOVO – odobri + opcionalno kreiraj Einblasen nalog
  approveAndForward(id, formData) {
    return axiosClient.post(`/jobs/${id}/approve-forward`, formData);
  },
};


