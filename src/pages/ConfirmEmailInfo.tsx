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

export function ConfirmEmailInfo() {
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
            Confirme seu E-mail
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p>O link de confirmação é válido por 24 horas.</p>
            <p className="mt-2">
              Não recebeu o e-mail? Verifique sua caixa de spam ou tente novamente.
            </p>
          </div>
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