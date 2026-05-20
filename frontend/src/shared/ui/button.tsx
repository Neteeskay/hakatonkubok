import * as React from "react";
import { cn } from "@/shared/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground hover:brightness-95 shadow-[0_10px_24px_rgba(255,199,42,0.28)]",
  secondary: "bg-foreground text-background hover:bg-foreground/88",
  ghost: "bg-surface-raised hover:bg-surface-muted",
  quiet: "bg-transparent hover:bg-surface-muted text-foreground/78",
  danger: "bg-destructive text-white hover:bg-destructive/90"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, children, ...props }, ref) => {
    const composedClassName = cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      );

    if (asChild && React.isValidElement<{ className?: string }>(children)) {
      return React.cloneElement(children, {
        className: cn(composedClassName, children.props.className)
      });
    }

    return (
      <button ref={ref} className={composedClassName} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
