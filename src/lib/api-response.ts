import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api-types";

export function ok<T>(
  message: string,
  options?: { data?: T; action?: string },
) {
  const payload: ApiSuccess<T> = {
    success: true,
    message,
    ...(options?.data !== undefined ? { data: options.data } : {}),
    ...(options?.action !== undefined ? { action: options.action } : {}),
  };

  return NextResponse.json(payload, { status: 200 });
}

export function created<T>(
  message: string,
  options?: { data?: T; action?: string },
) {
  const payload: ApiSuccess<T> = {
    success: true,
    message,
    ...(options?.data !== undefined ? { data: options.data } : {}),
    ...(options?.action !== undefined ? { action: options.action } : {}),
  };

  return NextResponse.json(payload, { status: 201 });
}

export function badRequest(message: string, errors?: unknown) {
  const payload: ApiError = {
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  };

  return NextResponse.json(payload, { status: 400 });
}

export function notFound(message: string) {
  const payload: ApiError = {
    success: false,
    message,
  };

  return NextResponse.json(payload, { status: 404 });
}

export function internalError(message = "An internal server error occurred.") {
  const payload: ApiError = {
    success: false,
    message,
  };

  return NextResponse.json(payload, { status: 500 });
}
