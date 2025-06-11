import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "brk-design-system";
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
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">
          {status === "success"
            ? "E-mail confirmado!"
            : status === "loading"
            ? "Confirmando..."
            : "Falha na Confirmação"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {status === "success"
            ? "Seu e-mail foi confirmado com sucesso. Agora você pode acessar sua conta."
            : status === "loading"
            ? "Aguarde enquanto confirmamos seu e-mail..."
            : error}
        </p>
      </div>

      {status === "success" && (
        <div className="text-center text-muted-foreground mb-6">
          <p>Você já pode fazer login na plataforma.</p>
        </div>
      )}

      <Button asChild className="w-full mb-6">
        <a href="/auth/login">Voltar para o Login</a>
      </Button>

      <div className="text-sm text-center text-muted-foreground">
        Precisa de ajuda?{" "}
        <a href="/support" className="text-primary hover:underline">
          Acesse nossa página de suporte
        </a>
      </div>
    </div>
  );
} 