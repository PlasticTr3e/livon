"use client";
import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "primary", size, ...props }, ref) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border border-green-600 active:from-green-800 shadow-sm",
    secondary:
      "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800",
    outline:
      "bg-transparent text-green-700 dark:text-green-400 border border-green-400 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20",
    ghost:
      "bg-transparent text-gray-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-green-700 dark:hover:text-green-400",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "px-4 py-2 font-medium rounded-md transition-all disabled:opacity-50",
        variants[variant],
        size ? sizes[size] : "",
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm",
        className,
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

export const Badge = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:text-slate-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
