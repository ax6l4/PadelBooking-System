import axios from "axios";
import { isDemoMode } from "../config/demo";
import { mockRequest } from "./mockApi";

const API_URL = isDemoMode
  ? "/demo-api"
  : import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

if (isDemoMode) {
  api.defaults.adapter = async (config) => {
    try {
      const result = await mockRequest(config);
      return {
        data: result.data,
        status: result.status || 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      };
    } catch (err) {
      const status = err.status || 400;
      return Promise.reject({
        message: err.message,
        name: "AxiosError",
        config,
        response: {
          data: err.data ?? err.message,
          status,
          statusText: status === 401 ? "Unauthorized" : "Bad Request",
          headers: {},
          config,
        },
        isAxiosError: true,
      });
    }
  };
}

export default api;
