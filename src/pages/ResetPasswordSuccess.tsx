import { Button } from "@/components/ui/button";

export function ResetPasswordSuccess() {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Instruções Enviadas!</h1>
        <p className="text-muted-foreground mt-2">
          Enviamos um e-mail com as instruções para recuperar sua senha.
        </p>
      </div>

      <div className="text-center text-muted-foreground mb-6">
        <p>O link de recuperação é válido por 60 minutos.</p>
        <p className="mt-2">
          Não recebeu o e-mail? Verifique sua caixa de spam ou tente
          novamente.
        </p>
      </div>

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
