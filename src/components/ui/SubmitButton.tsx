"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin h-4 w-4 flex-shrink-0", className)} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function SubmitButton({
  children,
  pendingText,
  className,
  ...props
}: {
  children: React.ReactNode;
  pendingText?: React.ReactNode;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn("inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition", className)}
      {...props}
    >
      {pending && <Spinner />}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
