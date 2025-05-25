import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { AuthService } from "@/lib/services/auth.service";

export function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("Token de confirmação inválido ou ausente.");
      return;
    }
    AuthService.confirmEmail(token)
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setError(
          err?.response?.data?.message ||
            "Não foi possível confirmar seu e-mail. O link pode estar expirado ou já ter sido utilizado."
        );
      });
  }, [searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {status === "success"
              ? "E-mail confirmado!"
              : status === "loading"
              ? "Confirmando..."
              : "Falha na Confirmação"}
          </CardTitle>
          <CardDescription className="text-center text-lg">
            {status === "success"
              ? "Seu e-mail foi confirmado com sucesso. Agora você pode acessar sua conta."
              : status === "loading"
              ? "Aguarde enquanto confirmamos seu e-mail..."
              : error}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="text-center text-muted-foreground">
              <p>Você já pode fazer login na plataforma.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <a href="/">Voltar para o Login</a>
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Precisa de ajuda?{" "}
            <a href="/support" className="text-primary hover:underline">
              Acesse nossa página de suporte
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 