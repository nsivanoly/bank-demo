import { AppConfig } from "../config";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiResponse {
  status: number;
  data: any;
}

export async function apiRequest(
  method: HttpMethod,
  endpoint: string,
  data?: any,
  auth: boolean | null = null
): Promise<ApiResponse> {
  const normalizedBase = AppConfig.API_BASE_URL.replace(/\/$/, "");
  const normalizedEndpoint = endpoint.replace(/^\//, "");
  const url = `${normalizedBase}/${normalizedEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const useAuth = auth ?? AppConfig.USE_AUTH;

  if (useAuth) {
    const token = localStorage.getItem("access_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    ...(data && method !== "GET" ? { body: JSON.stringify(data) } : {}),
  };

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("Content-Type") || "";
    const responseData = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return { status: response.status, data: responseData };
  } catch (error: unknown) {
    return {
      status: 0,
      data: { error: error instanceof Error ? error.message : "Network error" },
    };
  }
}

// Method wrappers
export const apiGet = (endpoint: string, auth: boolean | null = null) =>
  apiRequest("GET", endpoint, undefined, auth);

export const apiPost = (endpoint: string, data: any, auth: boolean | null = null) =>
  apiRequest("POST", endpoint, data, auth);

export const apiPut = (endpoint: string, data: any, auth: boolean | null = null) =>
  apiRequest("PUT", endpoint, data, auth);

export const apiDelete = (endpoint: string, auth: boolean | null = null) =>
  apiRequest("DELETE", endpoint, undefined, auth);
