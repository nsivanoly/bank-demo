import { AppConfig } from "../config";
import { trafficTracer } from "../services/traffic-tracer";

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

  // const sanitizedHeaders: Record<string, string> = { ...headers };
  // if (sanitizedHeaders.Authorization) {
  //   const token = sanitizedHeaders.Authorization.replace(/^Bearer\s+/i, "");
  //   sanitizedHeaders.Authorization = `Bearer ${token.slice(0, 12)}...`;
  // }

  const options: RequestInit = {
    method,
    headers,
    ...(data && method !== "GET" ? { body: JSON.stringify(data) } : {}),
  };

  const traceId = trafficTracer.startHttp({
    method,
    url,
    requestHeaders: { ...headers },
    requestBody: data && method !== "GET" ? data : undefined,
  });

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("Content-Type") || "";
    const responseData = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    trafficTracer.completeHttp(traceId, {
      responseStatus: response.status,
      responseStatusText: response.statusText,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      responseBody: responseData,
    });

    return { status: response.status, data: responseData };
  } catch (error: unknown) {
    trafficTracer.failHttp(
      traceId,
      error instanceof Error ? error.message : "Network error"
    );
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
