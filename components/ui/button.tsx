import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "destructive";
};

export function Button({
  className = "",
  children,
  variant = "default",
  ...props
}: ButtonProps) {
  const styles =
    variant === "outline"
      ? "border border-blue-600 bg-white text-blue-600 hover:bg-blue-50"
      : variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button
      className={`rounded-md px-4 py-2 font-semibold ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}