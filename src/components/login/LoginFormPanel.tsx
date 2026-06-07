import Link from "next/link";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { LoginBrandMark } from "./LoginBrandMark";
import { LoginDivider } from "./LoginDivider";
import { LoginSuccessAlert } from "./LoginSuccessAlert";
import { LoginThemeToggle } from "./LoginThemeToggle";
import { PasswordInput } from "./PasswordInput";

export type LoginCredentials = {
  email: string;
  password: string;
};

type LoginFormPanelProps = {
  credentials: LoginCredentials;
  error: string;
  successMessage: string;
  isLoading: boolean;
  isPasswordVisible: boolean;
  theme: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  onTogglePasswordVisibility: () => void;
  onToggleTheme: () => void;
};

export function LoginFormPanel({
  credentials,
  error,
  successMessage,
  isLoading,
  isPasswordVisible,
  theme,
  onChange,
  onSubmit,
  onTogglePasswordVisibility,
  onToggleTheme,
}: LoginFormPanelProps) {
  return (
    <div className="relative flex w-full flex-col justify-center bg-white px-10 py-16 dark:bg-[#111827] lg:w-[45%]">
      <LoginThemeToggle theme={theme} onToggle={onToggleTheme} />

      <div className="mx-auto w-full max-w-85">
        <LoginBrandMark className="mb-8 lg:hidden" />

        <h1 className="mb-2 text-[2.2rem] font-extrabold leading-tight text-gray-900 dark:text-white">
          Welcome!
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-400 dark:text-white">
          Log in to LIVON and help make your neighborhood
          <br />
          even better!
        </p>

        <LoginSuccessAlert message={successMessage} />

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={credentials.email}
            onChange={onChange}
            className="h-12 w-full rounded-full border border-gray-200 bg-slate-50 px-5 text-sm text-gray-800 transition-colors placeholder:text-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white dark:placeholder:text-slate-500"
            required
          />

          <PasswordInput
            value={credentials.password}
            isVisible={isPasswordVisible}
            onChange={onChange}
            onToggleVisibility={onTogglePasswordVisibility}
          />

          <div className="-mt-1 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-gray-400 transition-colors hover:text-green-600 dark:text-white dark:hover:text-green-400"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-600 text-base font-bold text-white shadow-sm shadow-green-200 transition-all hover:bg-green-700 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-green-400 dark:shadow-green-900"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>

          {error && (
            <p className="mt-2 text-center text-sm text-red-500">{error}</p>
          )}

          <LoginDivider label="or continue with" />
          <GoogleLoginButton />

          <p className="mt-2 text-center text-xs text-gray-400 dark:text-white">
            Don&apos;t have an account?{" "}
            <Link
              href="./register"
              className="font-semibold text-green-600 hover:underline dark:text-green-400"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
