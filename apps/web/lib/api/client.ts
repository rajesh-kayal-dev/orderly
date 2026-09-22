import { env } from "../env/env";
import { tokenStorage } from "../auth/token-storage";
import { ApiError } from "./errors";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string | null;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data: T;
  total?: number;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

class ApiClient {
  private getBaseUrl(): string {
    return env.apiUrl.replace(/\/$/, "");
  }

  private buildUrl(path: string, params?: RequestOptions["params"]): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const baseUrl = this.getBaseUrl();
    const url = new URL(`${baseUrl}${cleanPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(
    path: string,
    options: RequestOptions & { method: string; body?: unknown },
  ): Promise<T> {
    const { params, token, headers: customHeaders, body, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const activeToken = token ?? tokenStorage.getToken();
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    const init: RequestInit = {
      ...fetchOptions,
      headers,
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (networkError: unknown) {
      throw new ApiError(
        networkError instanceof Error ? networkError.message : "Network error occurred",
        0,
        "NETWORK_ERROR",
      );
    }

    let result: unknown = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        result = await response.json();
      } catch {
        result = null;
      }
    } else {
      result = await response.text();
    }

    if (!response.ok) {
      const errorObj = typeof result === "object" && result !== null ? (result as Record<string, any>) : {};
      const message =
        errorObj.error?.message ||
        errorObj.message ||
        (typeof result === "string" ? result : `Request failed with status ${response.status}`);
      const code = errorObj.error?.code || errorObj.code || `HTTP_${response.status}`;

      throw new ApiError(message, response.status, code, errorObj.error?.details);
    }

    // Extract `data` if standard orderly API envelope `{ success: true, data: ... }`
    if (
      result &&
      typeof result === "object" &&
      "data" in result &&
      ("success" in result ? result.success === true : true)
    ) {
      return (result as { data: T }).data;
    }

    return result as T;
  }

  public get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
