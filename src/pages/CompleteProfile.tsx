import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormItem,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Stepper } from "@/components/ui/stepper";

const estados = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const generos = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_dizer", label: "Prefiro não dizer" },
];

const nivelExperiencia = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
  { value: "profissional", label: "Profissional" },
];

const step1Schema = z.object({
  dataNascimento: z.string().min(1, "A data de nascimento é obrigatória"),
  genero: z.string().min(1, "O gênero é obrigatório"),
  cidade: z.string().min(1, "A cidade é obrigatória"),
  estado: z.string().length(2, "Selecione um estado válido"),
});

const step2Schema = z.object({
  possuiKartProprio: z.boolean().refine((value) => value === true, {
    message: "Informe se possui um kart próprio",
  }),
  tempoExperiencia: z.string().min(1, "O tempo de experiência é obrigatório"),
  participaCampeonatos: z.boolean().refine((value) => value === true, {
    message: "Informe se participa de campeonatos",
  }),
  nivelExperiencia: z.string().min(1, "O nível de experiência é obrigatório"),
  kartodromoPreferido: z.string().optional(),
  melhorResultado: z.string().optional(),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

export function CompleteProfile() {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
  const navigate = useNavigate();

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      dataNascimento: "",
      genero: "",
      cidade: "",
      estado: "",
    },
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      possuiKartProprio: false,
      tempoExperiencia: "",
      participaCampeonatos: false,
      nivelExperiencia: "",
      kartodromoPreferido: "",
      melhorResultado: "",
    },
  });

  const onSubmitStep1 = (data: Step1FormData) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const onSubmitStep2 = async (data: Step2FormData) => {
    try {
      if (!step1Data) return;

      const profileData = {
        ...step1Data,
        ...data,
      };

      //await updateProfile(profileData);
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Complete seu Perfil
          </CardTitle>
          <CardDescription className="text-center">
            <Stepper
              steps={["Informações Pessoais", "Experiência no Kart"]}
              currentStep={currentStep}
            />
            {currentStep === 1 ? "Informações Pessoais" : "Experiência no Kart"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {currentStep === 1 ? (
            <Form {...step1Form}>
              <form
                onSubmit={step1Form.handleSubmit(onSubmitStep1)}
                className="space-y-6"
              >
                <FormField
                  control={step1Form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="genero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu gênero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {generos.map((genero) => (
                            <SelectItem key={genero.value} value={genero.value}>
                              {genero.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estados.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Próximo
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...step2Form}>
              <form
                onSubmit={step2Form.handleSubmit(onSubmitStep2)}
                className="space-y-6"
              >
                <FormField
                  control={step2Form.control}
                  name="tempoExperiencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Há quanto tempo anda de Kart?</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2 anos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="participaCampeonatos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!!checked)
                          }
                        />
                      </FormControl>
                      <FormLabel>Participa de campeonatos?</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="nivelExperiencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Experiência</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nivelExperiencia.map((nivel) => (
                            <SelectItem key={nivel.value} value={nivel.value}>
                              {nivel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="kartodromoPreferido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kartódromo Preferido</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do kartódromo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setCurrentStep(1)}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="w-full">
                    Finalizar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
