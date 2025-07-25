import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "brk-design-system";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { AuthService } from "@/lib/services";

const formSchema = z.object({
  email: z.string().email("O email é inválido"),
});

export function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Send request with email
      await AuthService.forgotPassword({
        email: values.email,
      });

      navigate("/auth/reset-password/success");
    } catch (error: unknown) {
      console.error("Falha na solicitação:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível processar sua solicitação. Por favor, tente novamente mais tarde.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Recuperar Senha</h1>
        <p className="text-muted-foreground mt-2">
          Digite seu e-mail para receber as instruções de recuperação de senha
        </p>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar instruções"}
          </Button>
        </form>
      </Form>

      <div className="flex flex-col space-y-4 mt-6">
        <div className="text-sm text-center text-muted-foreground">
          Lembrou sua senha?{" "}
          <a href="/auth/login" className="text-primary hover:underline">
            Voltar para o login
          </a>
        </div>
      </div>
    </div>
  );
}
