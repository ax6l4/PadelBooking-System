import api from "./api";

export const workingHourService = {
  getAll: () => api.get("/CourtWorkingHour"),

  create: (data) => api.post("/CourtWorkingHour", data),

  update: (id, data) => api.put(`/CourtWorkingHour/${id}`, data),

  delete: (id) => api.delete(`/CourtWorkingHour/${id}`),
};
