const rawBase = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE = (rawBase && rawBase.trim()) ? (rawBase.startsWith("http") ? rawBase : `http://${rawBase.replace(/^:/, "")}`) : "http://localhost:3000";
console.log("API_BASE:", API_BASE);

export type ApiResponse<T> = { success: boolean; data?: T; error?: any };

async function request<T>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string,string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({ success: res.ok, data: null }));
  if (!res.ok) return { success: false, error: json };
  return json;
}

export const api = {
  signup: (p: any) => request("/signup", { method: "POST", body: JSON.stringify(p) }),
  login: (p: any) => request("/login", { method: "POST", body: JSON.stringify(p) }),
  // profiles
  getProfile: (id: number) => request(`/api/profiles/${id}`),
  updateProfile: (id: number, data: any) => request(`/api/profiles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  // categories
  getCategories: (userId?: number) => request(`/api/categories${userId ? `?userId=${userId}` : ""}`),
  createCategory: (payload: any) => request("/api/categories", { method: "POST", body: JSON.stringify(payload) }),
  deleteCategory: (id: number) => request(`/api/categories/${id}`, { method: "DELETE" }),
  // expenses
  getExpenses: (userId?: number) => request(`/api/expenses${userId ? `?userId=${userId}` : ""}`),
  createExpense: (payload: any) => request("/api/expenses", { method: "POST", body: JSON.stringify(payload) }),
  updateExpense: (id: number, payload: any) => request(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteExpense: (id: number) => request(`/api/expenses/${id}`, { method: "DELETE" }),
  // goals
  getGoals: (userId?: number) => request(`/api/goals${userId ? `?userId=${userId}` : ""}`),
  createGoal: (payload: any) => request("/api/goals", { method: "POST", body: JSON.stringify(payload) }),
  updateGoal: (id: number, payload: any) => request(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteGoal: (id: number) => request(`/api/goals/${id}`, { method: "DELETE" }),
  logout: () => localStorage.removeItem("token"),
};