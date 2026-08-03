import api from "./api";

export const courtService = {
  getAll: () => api.get("/Court"),

  getById: (id) => api.get(`/Court/${id}`),

  create: (data) => api.post("/Court", data),

  update: (id, data) => api.put(`/Court/${id}`, data),

  delete: (id) => api.delete(`/Court/${id}`),
};
