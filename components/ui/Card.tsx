import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "danger";
}

const variantClasses = {
  default: "bg-[#1a1f2e] border border-[#2a3040]",
  highlight: "bg-[#1a1f2e] border border-blue-500/30",
  danger: "bg-[#1a1f2e] border border-red-500/30",
};

export function Card({ variant = "default", children, className = "", ...props }: CardProps) {
  return (
    <div className={`rounded-xl ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
