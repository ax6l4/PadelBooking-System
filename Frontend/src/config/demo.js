/** Demo mode ON by default — set VITE_DEMO_MODE=false to use a real API */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE !== "false";

export const DEMO_STORAGE_KEY = "padel_demo_store_v2";
