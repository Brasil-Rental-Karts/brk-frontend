import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { Form, FormItem } from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = {
  email: {
    required: "O email é obrigatório",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "O email é inválido",
    },
  },
  password: {
    required: "A senha é obrigatória",
    minLength: {
      value: 8,
      message: "A senha deve ter pelo menos 8 caracteres",
    },
  },
};

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const formLogin = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email(formSchema.email.pattern.message),
        password: z.string().min(8, formSchema.password.minLength.message),
      })
    ),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: { email: string; password: string }) => {
    setError(null);

    try {
      await login(values);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      setError(
        error.response?.data?.message || 
        "Falha na autenticação. Por favor, verifique seu email e senha."
      );
    }
  };

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
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Entre com seu email e senha para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <Form {...formLogin}>
            <form
              onSubmit={formLogin.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <FormField
                control={formLogin.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="seuemail@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formLogin.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="********"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Esqueceu sua senha?{" "}
            <a href="/reset-password" className="text-primary hover:underline">
              Recuperar senha
            </a>
          </div>
          <div className="text-sm text-center text-muted-foreground">
            Não tem uma conta?{" "}
            <a href="/register" className="text-primary hover:underline">
              Registre-se
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
