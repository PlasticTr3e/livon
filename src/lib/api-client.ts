import type { ApiResponse } from "@/lib/api-types";

function buildNetworkError(message: string): ApiResponse<never> {
  return {
    success: false,
    message,
  };
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const isJson =
      response.headers
        .get("content-type")
        ?.toLowerCase()
        .includes("application/json") ?? false;

    if (!isJson) {
      if (!response.ok) {
        return buildNetworkError(
          `Request failed with status ${response.status}.`,
        );
      }

      return {
        success: true,
        message: "Request succeeded.",
      } as ApiResponse<T>;
    }

    const parsed = (await response.json()) as ApiResponse<T>;

    if (
      typeof parsed?.success !== "boolean" ||
      typeof parsed?.message !== "string"
    ) {
      return buildNetworkError("Invalid API response format.");
    }

    if (!response.ok && parsed.success) {
      return buildNetworkError(parsed.message);
    }

    return parsed;
  } catch {
    return buildNetworkError("Network error. Please try again.");
  }
}

export async function apiFetchJson<TRequest extends object, TResponse>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: TRequest,
  init?: Omit<RequestInit, "method" | "body">,
): Promise<ApiResponse<TResponse>> {
  return apiFetch<TResponse>(url, {
    method,
    body: JSON.stringify(body),
    ...init,
  });
}
