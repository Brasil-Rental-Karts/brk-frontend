import { useState, useEffect } from "react";
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

// Step schemas
const step1Schema = z.object({
  dataNascimento: z.string().min(1, "A data de nascimento é obrigatória"),
  genero: z.string().min(1, "O gênero é obrigatório"),
  cidade: z.string().min(1, "A cidade é obrigatória"),
  estado: z.string().length(2, "Selecione um estado válido"),
});

const step2Schema = z.object({
  possuiKartProprio: z.boolean(),
  tempoExperiencia: z.string().min(1, "O tempo de experiência é obrigatório"),
  participaCampeonatos: z.boolean(),
  nivelExperiencia: z.string().min(1, "O nível de experiência é obrigatório"),
  kartodromoPreferido: z.string().optional(),
  melhorResultado: z.string().optional(),
});

// Combined schema for the complete form
const formSchema = z.object({
  dataNascimento: z.string().min(1, "A data de nascimento é obrigatória"),
  genero: z.string().min(1, "O gênero é obrigatório"),
  cidade: z.string().min(1, "A cidade é obrigatória"),
  estado: z.string().length(2, "Selecione um estado válido"),
  possuiKartProprio: z.boolean(),
  tempoExperiencia: z.string().min(1, "O tempo de experiência é obrigatório"),
  participaCampeonatos: z.boolean(),
  nivelExperiencia: z.string().min(1, "O nível de experiência é obrigatório"),
  kartodromoPreferido: z.string().optional(),
  melhorResultado: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const defaultValues: FormData = {
  dataNascimento: "",
  genero: "",
  cidade: "",
  estado: "",
  possuiKartProprio: false,
  tempoExperiencia: "",
  participaCampeonatos: false,
  nivelExperiencia: "",
  kartodromoPreferido: "",
  melhorResultado: "",
};

type StepConfig = {
  id: number;
  title: string;
  fields: (keyof FormData)[];
  validate: (data: Partial<FormData>) => boolean;
};

export function CompleteProfile() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>(defaultValues);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const steps: StepConfig[] = [
    {
      id: 1,
      title: "Informações Pessoais",
      fields: ["dataNascimento", "genero", "cidade", "estado"],
      validate: (data) => {
        try {
          step1Schema.parse({
            dataNascimento: data.dataNascimento || "",
            genero: data.genero || "",
            cidade: data.cidade || "",
            estado: data.estado || "",
          });
          return true;
        } catch (error) {
          return false;
        }
      },
    },
    {
      id: 2,
      title: "Experiência no Kart",
      fields: [
        "possuiKartProprio",
        "tempoExperiencia",
        "participaCampeonatos",
        "nivelExperiencia",
        "kartodromoPreferido",
        "melhorResultado",
      ],
      validate: (data) => {
        try {
          step2Schema.parse({
            possuiKartProprio: data.possuiKartProprio || false,
            tempoExperiencia: data.tempoExperiencia || "",
            participaCampeonatos: data.participaCampeonatos || false,
            nivelExperiencia: data.nivelExperiencia || "",
            kartodromoPreferido: data.kartodromoPreferido,
            melhorResultado: data.melhorResultado,
          });
          return true;
        } catch (error) {
          return false;
        }
      },
    },
  ];

  const currentStepConfig = steps.find((step) => step.id === currentStep) || steps[0];

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    const currentStepData = getCurrentStepData();
    if (currentStepConfig.validate(currentStepData)) {
      updateFormData(currentStepData);
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    } else {
      // Validate current form fields to show errors
      form.trigger(currentStepConfig.fields as any);
    }
  };

  const goToPreviousStep = () => {
    const currentStepData = getCurrentStepData();
    updateFormData(currentStepData);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getCurrentStepData = (): Partial<FormData> => {
    const formValues = form.getValues();
    const stepFields = currentStepConfig.fields;
    return Object.fromEntries(
      Object.entries(formValues).filter(([key]) => stepFields.includes(key as keyof FormData))
    ) as Partial<FormData>;
  };

  const isLastStep = currentStep === steps.length;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentStepData = getCurrentStepData();
    
    if (isLastStep) {
      if (currentStepConfig.validate(currentStepData)) {
        try {
          navigate("/dashboard");
        } catch (error) {
          console.error("Erro ao atualizar perfil:", error);
        }
      } else {
        form.trigger(currentStepConfig.fields as any);
      }
    } else {
      goToNextStep();
    }
  };

  const renderFormFields = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
          </>
        );
      case 2:
        return (
          <>
            <FormField
              control={form.control}
              name="possuiKartProprio"
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
                  <FormLabel>Possui Kart próprio?</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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

            <FormField
              control={form.control}
              name="melhorResultado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Melhor Resultado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1º lugar no campeonato X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return null;
    }
  };

  // When step changes, reset form fields to current values from formData
  // This prevents values from previous steps showing in current step
  useEffect(() => {
    if (formData) {
      form.reset({ ...defaultValues, ...formData });
    }
  }, [currentStep, formData]);

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
              steps={steps.map(step => step.title)}
              currentStep={currentStep}
            />
            {currentStepConfig.title}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={handleFormSubmit}
              className="space-y-6"
            >
              {renderFormFields()}

              <div className="flex gap-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={goToPreviousStep}
                  >
                    Voltar
                  </Button>
                )}
                <Button type="submit" className="w-full">
                  {isLastStep ? "Finalizar" : "Próximo"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
