import { Loading } from "@/components/ui/loading";

interface RouteLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const RouteLoader = ({
  message = "Carregando...",
  size = "md",
}: RouteLoaderProps) => {
  const sizeMap = {
    sm: "sm" as const,
    md: "md" as const,
    lg: "lg" as const,
  };

  return <Loading type="spinner" size={sizeMap[size]} message={message} />;
};

// Full page loader
export const FullPageLoader = ({ message }: { message?: string }) => (
  <Loading type="full-page" size="lg" message={message} />
);
