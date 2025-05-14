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

export function ResetPasswordSuccess() {
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
            Instruções Enviadas!
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Enviamos um e-mail com as instruções para recuperar sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p>O link de recuperação é válido por 60 minutos.</p>
            <p className="mt-2">
              Não recebeu o e-mail? Verifique sua caixa de spam ou tente
              novamente.
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
