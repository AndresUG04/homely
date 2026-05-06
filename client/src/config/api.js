const API_URL = import.meta.env.VITE_API_URL || "";

export const api = {
  post: async (endpoint, body, token = null) => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const headers = {};
    if (!isFormData) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) return { error: data.error || "Error del servidor" };
      return data;
    } catch {
      return { error: "No se pudo conectar con el servidor" };
    }
  },

  put: async (endpoint, body, token = null) => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const headers = {};
    if (!isFormData) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) return { error: data.error || "Error del servidor" };
      return data;
    } catch {
      return { error: "No se pudo conectar con el servidor" };
    }
  },

  get: async (endpoint, token = null) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();
      if (!response.ok) return { error: data.error || "Error del servidor" };
      return data;
    } catch {
      return { error: "No se pudo conectar con el servidor" };
    }
  },

  delete: async (endpoint, token = null) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json();
      if (!response.ok) return { error: data.error || "Error del servidor" };
      return data;
    } catch {
      return { error: "No se pudo conectar con el servidor" };
    }
  },

  patch: async (endpoint, body, token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) return { error: data.error || "Error del servidor" };
      return data;
    } catch {
      return { error: "No se pudo conectar con el servidor" };
    }
  },
};
