import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const LoadingSpinner = ({ size = "md", text }: LoadingSpinnerProps) => {
  const { t } = useTranslation();
  const defaultText = text || t('common.loading');
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
      {defaultText && (
        <p className="text-muted-foreground animate-nudge-pulse">{defaultText}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
