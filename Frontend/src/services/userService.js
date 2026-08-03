import api from "./api";

export const userService = {
  register: (data) => api.post("/User/register", data),

  login: (data) => api.post("/User/login", data),

  getAll: () => api.get("/User"),
};
