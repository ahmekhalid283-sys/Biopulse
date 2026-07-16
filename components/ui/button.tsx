import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}