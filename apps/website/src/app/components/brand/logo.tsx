import { useId } from "react";
import { cn } from "../ui/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoTheme = "light" | "dark";

type LogoMarkProps = {
  className?: string;
  title?: string;
};

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  size?: LogoSize;
  theme?: LogoTheme;
  wordmark?: boolean;
};

const sizeClasses: Record<LogoSize, { mark: string; text: string }> = {
  sm: {
    mark: "h-7 w-7",
    text: "text-lg",
  },
  md: {
    mark: "h-8 w-8",
    text: "text-xl",
  },
  lg: {
    mark: "h-10 w-10",
    text: "text-2xl",
  },
};

export function LogoMark({ className, title }: LogoMarkProps) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="64"
          x2="64"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path
        d="M6 28C6 15.85 15.85 6 28 6h8c12.15 0 22 9.85 22 22v2c0 12.15-9.85 22-22 22H22l-10 6V50.5C7.36 45.67 6 39.5 6 33V28Z"
        fill={`url(#${gradientId})`}
      />
      <path d="M32 18l12 14h-8v12h-8V32h-8l12-14Z" fill="#FFFFFF" />
    </svg>
  );
}

export function BrandLogo({
  className,
  markClassName,
  textClassName,
  size = "md",
  theme = "light",
  wordmark = true,
}: BrandLogoProps) {
  const palette =
    theme === "dark"
      ? {
          wordmark: "text-white",
          accent: "from-[#A5B4FC] to-[#67E8F9]",
        }
      : {
          wordmark: "text-primary",
          accent: "from-[#4F46E5] to-[#06B6D4]",
        };

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("shrink-0", sizeClasses[size].mark, markClassName)} />
      {wordmark ? (
        <span
          className={cn(
            "inline-flex items-baseline tracking-[-0.04em]",
            sizeClasses[size].text,
            palette.wordmark,
            textClassName,
          )}
          style={{ fontWeight: 800 }}
        >
          <span>Swyft</span>
          <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", palette.accent)}>
            Up
          </span>
        </span>
      ) : null}
    </span>
  );
}
