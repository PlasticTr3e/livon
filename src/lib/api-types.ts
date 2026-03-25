export type ApiSuccess<T = unknown> = {
  success: true;
  message: string;
  data?: T;
  action?: string;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: unknown;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export function isApiSuccess<T>(
  response: ApiResponse<T>,
): response is ApiSuccess<T> {
  return response.success;
}
