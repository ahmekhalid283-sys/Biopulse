import React from "react";

export function Card({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border bg-white p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={className}>{children}</h2>;
}

export function CardContent({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className}>{children}</div>;
}