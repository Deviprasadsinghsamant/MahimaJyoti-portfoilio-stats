// API Client
// ───────────
// Typed HTTP client for Cloud Functions backend.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
}

class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public data?: unknown
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, token, headers = {} } = options;

    const config: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
            response.status,
            errorData?.message ?? `Request failed with status ${response.status}`,
            errorData
        );
    }

    return response.json();
}

export const apiClient = {
    get: <T>(endpoint: string, token?: string) =>
        request<T>(endpoint, { method: "GET", token }),

    post: <T>(endpoint: string, body: unknown, token?: string) =>
        request<T>(endpoint, { method: "POST", body, token }),

    put: <T>(endpoint: string, body: unknown, token?: string) =>
        request<T>(endpoint, { method: "PUT", body, token }),

    delete: <T>(endpoint: string, token?: string) =>
        request<T>(endpoint, { method: "DELETE", token }),
};

export { ApiError };
