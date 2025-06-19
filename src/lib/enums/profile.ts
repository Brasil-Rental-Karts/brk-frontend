// Define enums for each option type
export enum Gender {
  Male = 0,
  Female = 1,
  Other = 2,
  PreferNotToSay = 3
}

export enum KartExperienceYears {
  Never = 0,
  LessThanOneYear = 1,
  OneToTwoYears = 2,
  ThreeToFiveYears = 3,
  MoreThanFiveYears = 4
}

export enum RaceFrequency {
  Rarely = 0,
  Regularly = 1,
  Weekly = 2,
  Daily = 3
}

export enum ChampionshipParticipation {
  Never = 0,
  LocalRegional = 1,
  State = 2,
  National = 3
}

export enum CompetitiveLevel {
  Beginner = 0,
  Intermediate = 1,
  Competitive = 2,
  Professional = 3
}

export enum AttendsEvents {
  Yes = 0,
  No = 1,
  DependsOnDistance = 2
}

export enum InterestCategory {
  RentalKart = 0,
  FTRentalKart = 1,
  ProKart = 2,
  Endurance = 3,
  Teams = 4,
  LongChampionships = 5,
  SingleRaces = 6
}

// Define label mappings for each enum
export const genderLabels: Record<Gender, string> = {
  [Gender.Male]: "Masculino",
  [Gender.Female]: "Feminino",
  [Gender.Other]: "Outro",
  [Gender.PreferNotToSay]: "Prefiro não dizer"
};

export const kartExperienceYearsLabels: Record<KartExperienceYears, string> = {
  [KartExperienceYears.Never]: "Nunca corri",
  [KartExperienceYears.LessThanOneYear]: "Menos de 1 ano",
  [KartExperienceYears.OneToTwoYears]: "1 a 2 anos",
  [KartExperienceYears.ThreeToFiveYears]: "3 a 5 anos",
  [KartExperienceYears.MoreThanFiveYears]: "Mais de 5 anos"
};

export const raceFrequencyLabels: Record<RaceFrequency, string> = {
  [RaceFrequency.Rarely]: "Raramente (1x por mês ou menos)",
  [RaceFrequency.Regularly]: "Regularmente (2x ou mais por mês)",
  [RaceFrequency.Weekly]: "Toda semana",
  [RaceFrequency.Daily]: "Praticamente todo dia"
};

export const championshipParticipationLabels: Record<ChampionshipParticipation, string> = {
  [ChampionshipParticipation.Never]: "Nunca participei",
  [ChampionshipParticipation.LocalRegional]: "Sim, locais/regionais",
  [ChampionshipParticipation.State]: "Sim, estaduais",
  [ChampionshipParticipation.National]: "Sim, nacionais"
};

export const competitiveLevelLabels: Record<CompetitiveLevel, string> = {
  [CompetitiveLevel.Beginner]: "Iniciante",
  [CompetitiveLevel.Intermediate]: "Intermediário",
  [CompetitiveLevel.Competitive]: "Competitivo",
  [CompetitiveLevel.Professional]: "Profissional"
};

export const attendsEventsLabels: Record<AttendsEvents, string> = {
  [AttendsEvents.Yes]: "Sim",
  [AttendsEvents.No]: "Não",
  [AttendsEvents.DependsOnDistance]: "Dependendo da distância"
};

export const interestCategoryLabels: Record<InterestCategory, string> = {
  [InterestCategory.RentalKart]: "Kart Rental",
  [InterestCategory.FTRentalKart]: "Kart FT Rental (Com Marcha)",
  [InterestCategory.ProKart]: "Kart Pro",
  [InterestCategory.Endurance]: "Endurance",
  [InterestCategory.Teams]: "Equipes",
  [InterestCategory.LongChampionships]: "Campeonatos Longos",
  [InterestCategory.SingleRaces]: "Baterias Avulsas"
};

// Helper function to convert enums to options for select components
export function enumToOptions<T extends number>(enumObj: any, labels: Record<T, string>) {
  return Object.keys(enumObj)
    .filter(key => !isNaN(Number(enumObj[key]))) // Only keep numeric values
    .map(key => ({
      value: enumObj[key] as T,
      label: labels[enumObj[key] as T]
    }));
}

// Pre-built option arrays for common use
export const genderOptions = enumToOptions(Gender, genderLabels);
export const kartExperienceYearsOptions = enumToOptions(KartExperienceYears, kartExperienceYearsLabels);
export const raceFrequencyOptions = enumToOptions(RaceFrequency, raceFrequencyLabels);
export const championshipParticipationOptions = enumToOptions(ChampionshipParticipation, championshipParticipationLabels);
export const competitiveLevelOptions = enumToOptions(CompetitiveLevel, competitiveLevelLabels);
export const attendsEventsOptions = enumToOptions(AttendsEvents, attendsEventsLabels);
export const interestCategoryOptions = enumToOptions(InterestCategory, interestCategoryLabels); 