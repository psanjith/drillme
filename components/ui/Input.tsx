import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2.5 bg-[var(--card)] border rounded-lg text-slate-100 text-sm
            placeholder:text-slate-500 outline-none transition-all
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
            ${error ? "border-red-500/50" : "border-[var(--card-border)]"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2.5 bg-[var(--card)] border rounded-lg text-slate-100 text-sm
            placeholder:text-slate-500 outline-none transition-all resize-none
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
            ${error ? "border-red-500/50" : "border-[var(--card-border)]"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
