const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function qs(params: Record<string, any> | null) {
  if (!params) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) p.append(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const supabase = {
  from(table: string) {
    const state: { filter: Record<string, any> | null; orderBy: string | null } = {
      filter: null,
      orderBy: null,
    };

    return {
      order(col: string) {
        state.orderBy = col;
        return this;
      },
      eq(field: string, value: any) {
        state.filter = { ...(state.filter || {}), [field]: value };
        return this;
      },
      async select(_cols: string | string[] = "*") {
        const url = `${API_BASE}/api/${table}${qs(state.filter)}${state.orderBy ? `&_order=${state.orderBy}` : ""}`;
        const res = await fetch(url);
        const json = await res.json().catch(() => ({ success: false, data: null }));
        return { data: json.data ?? json, error: json.success === false ? json.error : null };
      },
      async single() {
        const r = await this.select("*");
        const single = Array.isArray(r.data) ? r.data[0] ?? null : r.data;
        return { data: single, error: r.error };
      },
      async insert(payload: any) {
        const url = `${API_BASE}/api/${table}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({ success: false, data: null }));
        return { data: json.data ?? null, error: json.success === false ? json.error : null };
      },
      async update(payload: any) {
        // backend expects /api/:table/:id for updates; try to use filter.id or fallback to PUT to collection
        const id = state.filter?.id;
        const url = id ? `${API_BASE}/api/${table}/${id}` : `${API_BASE}/api/${table}`;
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({ success: false, data: null }));
        return { data: json.data ?? null, error: json.success === false ? json.error : null };
      },
      async delete() {
        // backend expects /api/:table/:id for deletes; use filter.id if present
        const id = state.filter?.id;
        const url = id ? `${API_BASE}/api/${table}/${id}` : `${API_BASE}/api/${table}${qs(state.filter)}`;
        const res = await fetch(url, { method: "DELETE" });
        const json = await res.json().catch(() => ({ success: false, data: null }));
        return { data: json.data ?? null, error: json.success === false ? json.error : null };
      },
    };
  },

  auth: {
    async signUp({ email, password, username }: { email: string; password: string; username?: string }) {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });
      return await res.json().catch(() => ({ success: false, error: "invalid-json" }));
    },
    async signIn({ email, password }: { email: string; password: string }) {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({ success: false, error: "invalid-json" }));
      if (json.success && json.data?.token) localStorage.setItem("token", json.data.token);
      if (json.success && json.data?.user) localStorage.setItem("user", JSON.stringify(json.data.user));
      return json;
    },
    user() {
      try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    },
  },
};

export default supabase;