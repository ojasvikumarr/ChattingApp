import axios from "axios";

// Use the environment variable with a fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : (import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});