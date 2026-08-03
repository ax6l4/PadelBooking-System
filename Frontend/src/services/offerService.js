import api from "./api";

export const offerService = {
  getAll: () => api.get("/Offer"),

  getById: (id) => api.get(`/Offer/${id}`),

  create: (data) => api.post("/Offer", data),

  update: (id, data) => api.put(`/Offer/${id}`, data),

  delete: (id) => api.delete(`/Offer/${id}`),
};
