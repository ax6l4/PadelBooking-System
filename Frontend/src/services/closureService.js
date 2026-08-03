import api from "./api";

export const closureService = {
  getAll: () => api.get("/CourtClosure"),

  create: (data) => api.post("/CourtClosure", data),

  createBulk: (data) => api.post("/CourtClosure/bulk", data),

  delete: (id) => api.delete(`/CourtClosure/${id}`),
};
