import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask } from "@/components/ui/input-mask";
import {
  FormControl,
  FormDescription,
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

const phoneSchema = z.string().refine(
  (value) => {
    const numbersOnly = value.replace(/\D/g, "");
    return numbersOnly.length === 11;
  },
  {
    message: "O celular deve ter exatamente 11 dígitos (DDD + 9 + número)",
  }
);

// Schema for terms only validation
const termsSchema = z.object({
  acceptTerms: z.boolean().refine((value) => value === true, {
    message: "Você precisa aceitar os termos de uso e política de privacidade para continuar",
  }),
});

const formSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("O email é inválido"),
    phone: phoneSchema.transform((value) => value.replace(/\D/g, "")),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número")
      .regex(
        /[^A-Za-z0-9]/,
        "A senha deve conter pelo menos um caractere especial"
      ),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message:
        "Você precisa aceitar os termos de uso e política de privacidade para continuar",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export function Register() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { register, isLoading, loginWithGoogle } = useAuth();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onChange", // Enable validation on change
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);

    try {
      const { name, email, password, phone } = values;
      await register({
        name,
        email,
        password,
        phone,
      });
      
      // Redirect to login page after successful registration
      navigate("/");
    } catch (error: any) {
      console.error("Falha no registro:", error);
      setError(
        error.response?.data?.message || 
        "Ocorreu um erro durante o registro. Por favor, tente novamente."
      );
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    
    // Use Zod to validate only the terms acceptance
    try {
      // Validate terms using Zod schema
      const result = termsSchema.safeParse({ 
        acceptTerms: form.getValues("acceptTerms") 
      });
      
      if (!result.success) {
        // Set the form error for acceptTerms field using react-hook-form
        form.setError("acceptTerms", { 
          type: "manual", 
          message: "Você precisa aceitar os termos de uso e política de privacidade para continuar com o registro via Google" 
        });
        
        // Focus on the terms field
        const termsElement = document.querySelector('[name="acceptTerms"]');
        if (termsElement) {
          termsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (termsElement as HTMLElement).focus();
        }
        
        return;
      }
      
      // If validation passes, proceed with Google login
      await loginWithGoogle();
      // No navigation needed here as the page will redirect to Google
    } catch (error: any) {
      console.error("Google signup failed:", error);
      setError("Erro ao iniciar registro com Google. Por favor, tente novamente.");
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
          <CardTitle className="text-2xl font-bold text-center">
            Registro
          </CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <InputMask
                        mask="phone"
                        placeholder="(99) 99999-9999"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
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
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem id="terms-section" className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        id="acceptTerms"
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="acceptTerms">
                        Aceito os termos de uso e política de privacidade
                      </FormLabel>
                      <FormDescription>
                        Ao criar sua conta, você concorda com nossos{" "}
                        <a
                          href="/terms"
                          className="text-primary hover:underline"
                        >
                          termos de uso
                        </a>{" "}
                        e{" "}
                        <a
                          href="/privacy"
                          className="text-primary hover:underline"
                        >
                          política de privacidade
                        </a>
                        . Seus dados serão processados de acordo com a LGPD e
                        poderão ser compartilhados com parceiros conforme
                        descrito em nossa política de privacidade.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
               
              <div className="space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Registrar"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"
                    />
                  </svg>
                  Registrar com Google
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <a href="/" className="text-primary hover:underline">
              Faça login
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
