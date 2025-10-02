import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const LoadingSpinner = ({ size = "md", text = "Cargando..." }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
        <div className="absolute inset-0 animate-pulse-glow rounded-full" />
      </div>
      {text && (
        <p className="text-muted-foreground animate-nudge-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
