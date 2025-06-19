import { Button } from "brk-design-system";

export function ConfirmEmailInfo() {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Confirme seu E-mail</h1>
        <p className="text-muted-foreground mt-2">
          Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
        </p>
      </div>

      <div className="text-center text-muted-foreground mb-6">
        <p>O link de confirmação é válido por 24 horas.</p>
        <p className="mt-2">
          Não recebeu o e-mail? Verifique sua caixa de spam ou tente novamente.
        </p>
      </div>

      <Button asChild className="w-full mb-6">
        <a href="/auth/login">Voltar para o Login</a>
      </Button>

    </div>
  );
} 