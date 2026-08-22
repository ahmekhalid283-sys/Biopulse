import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 ${className}`}
      {...props}
    />
  );
}