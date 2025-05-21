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

interface city {
  id: number;
  nome: string;
}

const states = [
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

const genders = [
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

const raceFrequency = [
  { value: "raramente", label: "Raramente (1x por mês ou menos)" },
  { value: "regularmente", label: "Regularmente (2x ou mais por mês)" },
  { value: "semanalmente", label: "Toda semana" },
  { value: "diariamente", label: "Praticamente todo dia" },
];

const championshipParticipation = [
  { value: "nunca", label: "Nunca participei" },
  { value: "local", label: "Sim, locais/regionais" },
  { value: "estadual", label: "Sim, estaduais" },
  { value: "nacional", label: "Sim, nacionais" },
];

const competitiveLevel = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "competitivo", label: "Competitivo" },
  { value: "profissional", label: "Profissional" },
];

const attendsEvents = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "depende_distancia", label: "Dependendo da distância" },
];

const interestCategories = [
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
  birthDate: z.string().min(1, "A data de nascimento é obrigatória"),
  gender: z.string().min(1, "O gênero é obrigatório"),
  city: z.string().min(1, "A cidade é obrigatória"),
  state: z.string().length(2, "Selecione um estado válido"),
  experienceTime: z.string().min(1, "O tempo de experiência é obrigatório"),
  raceFrequency: z.string().min(1, "A frequência de corrida é obrigatória"),
  championshipParticipation: z
    .string()
    .min(1, "A participação em campeonatos é obrigatória"),
    competitiveLevel: z
    .string()
    .min(1, "O nível de competitividade é obrigatório"),
  hasOwnKart: z.boolean(),
  isTeamMember: z.boolean(),
  teamName: z.string().optional(),
  usesTelemetry: z.boolean(),
  telemetryType: z.string().optional(),
  attendsEvents: z
    .string()
    .min(1, "Selecione sua disponibilidade para eventos"),
  interestCategories: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma categoria"),
  preferredTrack: z.string().optional(),
});


// Step schemas
const step1Schema = z.object({
  nickName: z.string().min(1, "O apelido ou nome de piloto é obrigatório"),
  birthDate: z.string().min(1, "A data de nascimento é obrigatória"),
  gender: z.string().min(1, "O gênero é obrigatório"),
  city: z.string().min(1, "A cidade é obrigatória"),
  state: z.string().length(2, "Selecione um estado válido"),
});

const step2Schema = z.object({
  experienceTime: z.string().min(1, "O tempo de experiência é obrigatório"),
  raceFrequency: z.string().min(1, "A frequência de corrida é obrigatória"),
  championshipParticipation: z
    .string()
    .min(1, "A participação em campeonatos é obrigatória"),
    competitiveLevel: z
    .string()
    .min(1, "O nível de competitividade é obrigatório"),
});

const step3Schema = z.object({
  hasOwnKart: z.boolean(),
  isTeamMember: z.boolean(),
  teamName: z.string().optional(),
  usesTelemetry: z.boolean(),
  telemetryType: z.string().optional(),
  attendsEvents: z
    .string()
    .min(1, "Selecione sua disponibilidade para eventos"),
  interestCategories: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma categoria"),
  preferredTrack: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const defaultValues: FormData = {
  nickName: "",
  birthDate: "",
  gender: "",
  city: "",
  state: "",
  experienceTime: "",
  raceFrequency: "",
  championshipParticipation: "",
  competitiveLevel: "",
  hasOwnKart: false,
  isTeamMember: false,
  teamName: "",
  usesTelemetry: false,
  telemetryType: "",
  attendsEvents: "",
  interestCategories: [],
  preferredTrack: "",
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
  const [cities, setCities] = useState<city[]>([]);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const loadCities = async (uf: string) => {
    try {
      const response = await axios.get<city[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      );
      setCities(response.data);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
      setCities([]);
    }
  };

  useEffect(() => {
    const selectedStates = form.watch("state");
    if (selectedStates) {
      loadCities(selectedStates);
      form.setValue("city", "");
    }
  }, [form.watch("state")]);

  const steps: StepConfig[] = [
    {
      id: 1,
      title: "Informações do Piloto",
      fields: ["nickName", "birthDate", "gender", "city", "state"],
      validate: (data) => {
        try {
          step1Schema.parse({
            nickName: data.nickName || "",
            birthDate: data.birthDate || "",
            gender: data.gender || "",
            city: data.city || "",
            state: data.state || "",
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
        "raceFrequency",
        "experienceTime",
        "championshipParticipation",
        "competitiveLevel",
      ],
      validate: (data) => {
        try {
          step2Schema.parse({
            raceFrequency: data.raceFrequency || "",
            experienceTime: data.experienceTime || "",
            championshipParticipation: data.championshipParticipation || false,
            competitiveLevel: data.competitiveLevel || "",
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
        "hasOwnKart",
        "preferredTrack",
        "isTeamMember",
        "teamName",
        "usesTelemetry",
        "telemetryType",
        "attendsEvents",
        "interestCategories",
      ],
      validate: (data) => {
        try {
          step3Schema.parse({
            hasOwnKart: data.hasOwnKart || false,
            preferredTrack: data.preferredTrack,
            isTeamMember: data.isTeamMember || false,
            teamName: data.teamName,
            usesTelemetry: data.usesTelemetry || false,
            telemetryType: data.telemetryType,
            attendsEvents: data.attendsEvents || "",
            interestCategories: data.interestCategories || [],
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
              name="birthDate"
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
              name="gender"
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
                      {genders.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
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
              name="state"
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
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
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
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!form.watch("state") || cities.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua cidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.nome}>
                          {city.nome}
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
              name="experienceTime"
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
              name="raceFrequency"
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
                      {raceFrequency.map((frequency) => (
                        <SelectItem key={frequency.value} value={frequency.value}>
                          {frequency.label}
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
              name="championshipParticipation"
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
                      {championshipParticipation.map((participation) => (
                        <SelectItem key={participation.value} value={participation.value}>
                          {participation.label}
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
              name="competitiveLevel"
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
                      {competitiveLevel.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
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
              name="hasOwnKart"
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
              name="isTeamMember"
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
                      name="teamName"
                      render={({ field: teamNameField }) => (
                        <FormItem className="ml-7">
                          <FormControl>
                            <Input
                              placeholder="Nome da equipe"
                              {...teamNameField}
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
              name="usesTelemetry"
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
                      name="telemetryType"
                      render={({ field: telemetryTypeField }) => (
                        <FormItem className="ml-7">
                          <FormControl>
                            <Input
                              placeholder="Qual(is)?"
                              {...telemetryTypeField}
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
              name="attendsEvents"
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
                      {attendsEvents.map((events) => (
                        <SelectItem key={events.value} value={events.value}>
                          {events.label}
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
              name="interestCategories"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Quais categorias mais te interessam?</FormLabel>
                  <FormControl>
                    <div className="flex flex-col space-y-2">
                      {interestCategories.map((categories) => (
                        <div
                          key={categories.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={field.value?.includes(categories.value)}
                            onCheckedChange={(checked) => {
                              const updatedCategories = checked
                                ? [...(field.value || []), categories.value]
                                : field.value?.filter(
                                    (value) => value !== categories.value
                                  ) || [];
                              field.onChange(updatedCategories);
                            }}
                          />
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {categories.label}
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
              name="preferredTrack"
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
