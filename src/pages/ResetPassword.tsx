import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
// @ts-ignore
import ReCAPTCHA from "react-google-recaptcha";
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

const formSchema = z.object({
  email: z.string().email("O email é inválido"),
  recaptcha: z.string().min(1, "Por favor, confirme que você não é um robô"),
});

export function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaKey, setRecaptchaKey] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      recaptcha: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      console.log("Solicitação de recuperação de senha:", values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Aqui você implementaria a lógica de envio do email de recuperação
      window.location.href = "/reset-password-success";
    } catch (error) {
      console.error("Falha na solicitação:", error);
    } finally {
      setIsLoading(false);
      setRecaptchaKey(""); // Reseta o reCAPTCHA após o envio
    }
  };

  const handleRecaptchaChange = (value: string | null) => {
    form.setValue("recaptcha", value || "");
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
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-center">
            Digite seu e-mail para receber as instruções de recuperação de senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                name="recaptcha"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <ReCAPTCHA
                        sitekey="6LdgHDorAAAAALScjWUJTQKItJDpWpNWWhQTc67Z"
                        onChange={handleRecaptchaChange}
                        key={recaptchaKey}
                      />
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Lembrou sua senha?{" "}
            <a href="/" className="text-primary hover:underline">
              Voltar para o login
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
