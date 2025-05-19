import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
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

interface Cidade {
  id: number;
  nome: string;
}

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

const kartExperienceYears = [
  { value: "0", label: "Nunca corri" },
  { value: "1", label: "Menos de 1 ano" },
  { value: "2", label: "1 a 2 anos" },
  { value: "3", label: "3 a 5 anos" },
  { value: "4", label: "Mais de 5 anos" },
];

const frequenciaCorrida = [
  { value: "raramente", label: "Raramente (1x por mês ou menos)" },
  { value: "regularmente", label: "Regularmente (2x ou mais por mês)" },
  { value: "semanalmente", label: "Toda semana" },
  { value: "diariamente", label: "Praticamente todo dia" },
];

const participaCampeonatos = [
  { value: "nunca", label: "Nunca participei" },
  { value: "local", label: "Sim, locais/regionais" },
  { value: "estadual", label: "Sim, estaduais" },
  { value: "nacional", label: "Sim, nacionais" },
];

const nivelCompetitividade = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "competitivo", label: "Competitivo" },
  { value: "profissional", label: "Profissional" },
];

// Step schemas
const step1Schema = z.object({
  nickName: z.string().min(1, "O apelido ou nome de piloto é obrigatório"),
  dataNascimento: z.string().min(1, "A data de nascimento é obrigatória"),
  genero: z.string().min(1, "O gênero é obrigatório"),
  cidade: z.string().min(1, "A cidade é obrigatória"),
  estado: z.string().length(2, "Selecione um estado válido"),
});

const step2Schema = z.object({
  tempoExperiencia: z.string().min(1, "O tempo de experiência é obrigatório"),
  frequenciaCorrida: z.string().min(1, "A frequência de corrida é obrigatória"),
  participaCampeonatos: z
    .string()
    .min(1, "A participação em campeonatos é obrigatória"),
  nivelCompetitividade: z
    .string()
    .min(1, "O nível de competitividade é obrigatório"),
});

const step3Schema = z.object({
  possuiKartProprio: z.boolean(),
  participaEquipe: z.boolean(),
  nomeEquipe: z.string().optional(),
  usaTelemetria: z.boolean(),
  tipoTelemetria: z.string().optional(),
  participaEventos: z
    .string()
    .min(1, "Selecione sua disponibilidade para eventos"),
  categoriasInteresse: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma categoria"),
  kartodromoPreferido: z.string().optional(),
});

const participaEventosOpcoes = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "depende_distancia", label: "Dependendo da distância" },
];

const categoriasInteresseOpcoes = [
  { value: "rental_kart_leve", label: "Rental kart leve" },
  { value: "rental_kart_pesado", label: "Rental kart pesado" },
  { value: "kart_2_tempos", label: "Kart 2 tempos" },
  { value: "endurance", label: "Endurance" },
  { value: "equipes", label: "Equipes" },
  { value: "campeonatos_longos", label: "Campeonatos longos" },
  { value: "baterias_avulsas", label: "Baterias avulsas" },
];

// Combined schema for the complete form
const formSchema = z.object({
  nickName: z.string().min(1, "O apelido ou nome de piloto é obrigatório"),
  dataNascimento: z.string().min(1, "A data de nascimento é obrigatória"),
  genero: z.string().min(1, "O gênero é obrigatório"),
  cidade: z.string().min(1, "A cidade é obrigatória"),
  estado: z.string().length(2, "Selecione um estado válido"),
  tempoExperiencia: z.string().min(1, "O tempo de experiência é obrigatório"),
  frequenciaCorrida: z.string().min(1, "A frequência de corrida é obrigatória"),
  participaCampeonatos: z
    .string()
    .min(1, "A participação em campeonatos é obrigatória"),
  nivelCompetitividade: z
    .string()
    .min(1, "O nível de competitividade é obrigatório"),
  possuiKartProprio: z.boolean(),
  participaEquipe: z.boolean(),
  nomeEquipe: z.string().optional(),
  usaTelemetria: z.boolean(),
  tipoTelemetria: z.string().optional(),
  participaEventos: z
    .string()
    .min(1, "Selecione sua disponibilidade para eventos"),
  categoriasInteresse: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma categoria"),
  kartodromoPreferido: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const defaultValues: FormData = {
  nickName: "",
  dataNascimento: "",
  genero: "",
  cidade: "",
  estado: "",
  tempoExperiencia: "",
  frequenciaCorrida: "",
  participaCampeonatos: "",
  nivelCompetitividade: "",
  possuiKartProprio: false,
  participaEquipe: false,
  nomeEquipe: "",
  usaTelemetria: false,
  tipoTelemetria: "",
  participaEventos: "",
  categoriasInteresse: [],
  kartodromoPreferido: "",
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
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const carregarCidades = async (uf: string) => {
    try {
      const response = await axios.get<Cidade[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      );
      setCidades(response.data);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
      setCidades([]);
    }
  };

  useEffect(() => {
    const estadoSelecionado = form.watch("estado");
    if (estadoSelecionado) {
      carregarCidades(estadoSelecionado);
      form.setValue("cidade", "");
    }
  }, [form.watch("estado")]);

  const steps: StepConfig[] = [
    {
      id: 1,
      title: "Informações do Piloto",
      fields: ["nickName", "dataNascimento", "genero", "cidade", "estado"],
      validate: (data) => {
        try {
          step1Schema.parse({
            nickName: data.nickName || "",
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
        "frequenciaCorrida",
        "tempoExperiencia",
        "participaCampeonatos",
        "nivelCompetitividade",
      ],
      validate: (data) => {
        try {
          step2Schema.parse({
            frequenciaCorrida: data.frequenciaCorrida || "",
            tempoExperiencia: data.tempoExperiencia || "",
            participaCampeonatos: data.participaCampeonatos || false,
            nivelCompetitividade: data.nivelCompetitividade || "",
          });
          return true;
        } catch (error) {
          return false;
        }
      },
    },
    {
      id: 3,
      title: "Estrutura e Interesse",
      fields: [
        "possuiKartProprio",
        "kartodromoPreferido",
        "participaEquipe",
        "nomeEquipe",
        "usaTelemetria",
        "tipoTelemetria",
        "participaEventos",
        "categoriasInteresse",
      ],
      validate: (data) => {
        try {
          step3Schema.parse({
            possuiKartProprio: data.possuiKartProprio || false,
            kartodromoPreferido: data.kartodromoPreferido,
            participaEquipe: data.participaEquipe || false,
            nomeEquipe: data.nomeEquipe,
            usaTelemetria: data.usaTelemetria || false,
            tipoTelemetria: data.tipoTelemetria,
            participaEventos: data.participaEventos || "",
            categoriasInteresse: data.categoriasInteresse || [],
          });
          return true;
        } catch (error) {
          return false;
        }
      },
    },
  ];

  const currentStepConfig =
    steps.find((step) => step.id === currentStep) || steps[0];

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
      Object.entries(formValues).filter(([key]) =>
        stepFields.includes(key as keyof FormData)
      )
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
              name="nickName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido ou Nome de Piloto</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      max="2023-01-01"
                      min="1900-01-01"
                      {...field}
                    />
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!form.watch("estado") || cidades.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua cidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cidades.map((cidade) => (
                        <SelectItem key={cidade.id} value={cidade.nome}>
                          {cidade.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              name="tempoExperiencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Há quanto tempo anda de Kart?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tempo de experiência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kartExperienceYears.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="frequenciaCorrida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Com que frequência corre?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequenciaCorrida.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
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
              name="participaCampeonatos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Já participou de campeonatos?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua participação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {participaCampeonatos.map((part) => (
                        <SelectItem key={part.value} value={part.value}>
                          {part.label}
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
              name="nivelCompetitividade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nível de competitividade que se considera:
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu nível" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {nivelCompetitividade.map((nivel) => (
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
          </>
        );
      case 3:
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
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  </FormControl>
                  <FormLabel>Possui Kart próprio?</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participaEquipe"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <div className="flex flex-row items-start space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <FormLabel>Participa de alguma equipe?</FormLabel>
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="nomeEquipe"
                      render={({ field: nomeEquipeField }) => (
                        <FormItem className="ml-7">
                          <FormControl>
                            <Input
                              placeholder="Nome da equipe"
                              {...nomeEquipeField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usaTelemetria"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <div className="flex flex-row items-start space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <FormLabel>
                      Utiliza telemetria, coach ou outro tipo de acompanhamento
                      técnico?
                    </FormLabel>
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="tipoTelemetria"
                      render={({ field: tipoTelemetriaField }) => (
                        <FormItem className="ml-7">
                          <FormControl>
                            <Input
                              placeholder="Qual(is)?"
                              {...tipoTelemetriaField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participaEventos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Disposto a participar de eventos em outras cidades?
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua disponibilidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {participaEventosOpcoes.map((opcao) => (
                        <SelectItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
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
              name="categoriasInteresse"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Quais categorias mais te interessam?</FormLabel>
                  <FormControl>
                    <div className="flex flex-col space-y-2">
                      {categoriasInteresseOpcoes.map((categoria) => (
                        <div
                          key={categoria.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={field.value?.includes(categoria.value)}
                            onCheckedChange={(checked) => {
                              const updatedCategories = checked
                                ? [...(field.value || []), categoria.value]
                                : field.value?.filter(
                                    (value) => value !== categoria.value
                                  ) || [];
                              field.onChange(updatedCategories);
                            }}
                          />
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {categoria.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
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
              steps={steps.map((step) => step.title)}
              currentStep={currentStep}
            />
            {currentStepConfig.title}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
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
