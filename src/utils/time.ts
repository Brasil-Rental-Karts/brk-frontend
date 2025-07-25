/**
 * Utilitários para cálculos de tempo
 */

/**
 * Converte tempo no formato MM:SS.sss para milissegundos
 */
export const convertTimeToMs = (time: string): number => {
  if (!time) return 0;

  const [minutes, seconds] = time.includes(":") ? time.split(":") : ["0", time];

  const [secs, ms] = seconds.includes(".")
    ? seconds.split(".")
    : [seconds, "0"];

  return parseFloat(minutes) * 60000 + parseFloat(secs) * 1000 + parseFloat(ms);
};

/**
 * Converte milissegundos para formato MM:SS.sss
 */
export const convertMsToTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
};

/**
 * Converte segundos para formato MM:SS.sss
 */
export const convertSecondsToTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}.000`;
};

/**
 * Calcula o tempo total considerando punições
 * O tempo salvo na base já inclui as punições, então precisamos subtrair para mostrar o tempo real
 */
export const calculateTotalTimeWithPenalties = (
  savedTime: string | undefined,
  penaltyTimeSeconds: number | undefined,
): {
  originalTime: string | undefined; // Tempo real da corrida (sem punições)
  penaltyTime: string | undefined; // Tempo de punição
  finalTime: string | undefined; // Tempo salvo na base (com punições)
  hasPenalty: boolean;
} => {
  if (!savedTime) {
    return {
      originalTime: undefined,
      penaltyTime: undefined,
      finalTime: undefined,
      hasPenalty: false,
    };
  }

  const savedTimeMs = convertTimeToMs(savedTime);
  const penaltyTimeMs = penaltyTimeSeconds ? penaltyTimeSeconds * 1000 : 0;
  const originalTimeMs = savedTimeMs - penaltyTimeMs; // Subtrair punição do tempo salvo

  return {
    originalTime: convertMsToTime(originalTimeMs), // Tempo real da corrida
    penaltyTime: penaltyTimeSeconds
      ? convertSecondsToTime(penaltyTimeSeconds)
      : undefined,
    finalTime: savedTime, // Tempo salvo na base (já inclui punições)
    hasPenalty: penaltyTimeSeconds ? penaltyTimeSeconds > 0 : false,
  };
};

/**
 * Formata tempo para exibição com indicação de punição
 * Mostra o tempo real da corrida + tempo de punição
 */
export const formatTimeWithPenalty = (
  savedTime: string | undefined,
  penaltyTimeSeconds: number | undefined,
  isImportMode: boolean = false,
  hasImportedPenalties: boolean = false,
): string => {
  if (!savedTime) return "-";

  if (isImportMode || hasImportedPenalties) {
    // Quando há punições importadas: o tempo salvo já é o tempo real (sem punições)
    // Apenas mostramos o tempo salvo + punição
    if (penaltyTimeSeconds && penaltyTimeSeconds > 0) {
      const penaltyTime = convertSecondsToTime(penaltyTimeSeconds);
      return `${savedTime} (+${penaltyTime})`;
    }

    return savedTime;
  } else {
    // Sem punições importadas: tempo salvo é o tempo real, então apenas mostramos o tempo salvo + punição se houver
    if (penaltyTimeSeconds && penaltyTimeSeconds > 0 && savedTime) {
      const penaltyTime = convertSecondsToTime(penaltyTimeSeconds);
      return `${savedTime} (+${penaltyTime})`;
    }

    return savedTime || "-";
  }
};
