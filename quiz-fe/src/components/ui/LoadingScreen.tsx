import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      {message ? (
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{message}</p>
        </div>
      ) : (
        <Loader2 size={32} className="animate-spin text-primary" />
      )}
    </div>
  );
}
