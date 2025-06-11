import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "brk-design-system";
import { Input } from "brk-design-system";
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "brk-design-system";
import { Form, FormItem } from "brk-design-system";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, loginWithGoogle, isAuthenticated, isFirstLogin } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isFirstLogin) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isFirstLogin, isLoading, navigate]);

  // Check for error message in the location state (from redirects)
  useEffect(() => {
    if (location.state?.error) {
      toast.error(location.state.error);
      // Clear the error from location state to avoid showing it again on refresh
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state, location.pathname]);

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
    try {
      const { firstLogin } = await login(values);
      
      // Show success message
      toast.success("Login realizado com sucesso!");
      
      // Redirect based on firstLogin status
      if (firstLogin) {
        navigate("/complete-profile");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        
        if (status === 401) {
          // Use the specific message from backend
          const errorMessage = message || "Email ou senha incorretos. Por favor, verifique suas credenciais.";
          toast.error(errorMessage);
        } else if (status === 403) {
          const errorMessage = message || "Sua conta não tem permissão para acessar o sistema.";
          toast.error(errorMessage);
        } else if (status === 429) {
          const errorMessage = message || "Muitas tentativas de login. Por favor, tente novamente mais tarde.";
          toast.error(errorMessage);
        } else if (status >= 400 && status < 500) {
          // Client errors
          const errorMessage = message || "Erro na solicitação. Por favor, verifique os dados informados.";
          toast.error(errorMessage);
        } else if (status >= 500) {
          // Server errors
          const errorMessage = message || "Erro interno do servidor. Por favor, tente novamente mais tarde.";
          toast.error(errorMessage);
        } else if (message) {
          toast.error(message);
        } else {
          toast.error("Erro ao fazer login. Por favor, tente novamente.");
        }
      } else if (error.request) {
        toast.error("Não foi possível conectar ao servidor. Verifique sua conexão de internet.");
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Falha na autenticação. Por favor, verifique seu email e senha.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // No navigation needed here as the page will redirect to Google
    } catch (error: any) {
      toast.error("Erro ao iniciar login com Google. Por favor, tente novamente.");
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-muted-foreground mt-2">
          Entre com seu email e senha para acessar a plataforma
        </p>
      </div>

      <Form {...formLogin}>
        <form
          onSubmit={formLogin.handleSubmit(onSubmit)}
          className="space-y-6"
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      <Button 
        type="button" 
        variant="outline" 
        className="w-full" 
        onClick={handleGoogleLogin}
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
        Entrar com Google
      </Button>

      <div className="flex flex-col space-y-4 mt-6">
        <div className="text-sm text-center text-muted-foreground">
          Esqueceu sua senha?{" "}
          <a href="/auth/reset-password" className="text-primary hover:underline">
            Recuperar senha
          </a>
        </div>
        <div className="text-sm text-center text-muted-foreground">
          Não tem uma conta?{" "}
          <a href="/auth/register" className="text-primary hover:underline">
            Cadastre-se
          </a>
        </div>
      </div>
    </div>
  );
}
