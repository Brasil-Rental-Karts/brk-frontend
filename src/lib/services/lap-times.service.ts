import api from "../axios";

export interface LapTime {
  lap: number;
  time: string;
  timeMs: number;
}

export interface LapTimes {
  id: string;
  userId: string;
  stageId: string;
  categoryId: string;
  batteryIndex: number;
  kartNumber: number;
  lapTimes: LapTime[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export class LapTimesService {
  private static baseUrl = "/lap-times";

  static async getLapTimesByStage(stageId: string): Promise<LapTimes[]> {
    const response = await api.get(`${this.baseUrl}/stage/${stageId}`);
    return response.data;
  }

  static async getLapTimesByStageAndCategory(
    stageId: string,
    categoryId: string,
  ): Promise<LapTimes[]> {
    const response = await api.get(
      `${this.baseUrl}/stage/${stageId}/category/${categoryId}`,
    );
    return response.data;
  }

  static async getLapTimesByUser(
    stageId: string,
    categoryId: string,
    userId: string,
    batteryIndex?: number,
  ): Promise<LapTimes | null> {
    const params = batteryIndex !== undefined ? { batteryIndex } : {};
    const response = await api.get(
      `${this.baseUrl}/stage/${stageId}/category/${categoryId}/user/${userId}`,
      { params },
    );
    return response.data;
  }

  static async saveLapTimes(
    stageId: string,
    categoryId: string,
    userId: string,
    data: {
      batteryIndex: number;
      kartNumber: number;
      lapTimes: LapTime[];
    },
  ): Promise<LapTimes> {
    const response = await api.post(
      `${this.baseUrl}/stage/${stageId}/category/${categoryId}/user/${userId}`,
      data,
    );
    return response.data;
  }

  static async importLapTimesFromExcel(
    stageId: string,
    categoryId: string,
    data: {
      batteryIndex: number;
      excelData: any[];
      kartToUserMapping: { [kartNumber: number]: string };
    },
  ): Promise<{ imported: number; errors: string[] }> {
    const response = await api.post(
      `${this.baseUrl}/stage/${stageId}/category/${categoryId}/import`,
      data,
    );
    return response.data;
  }

  static async deleteLapTimes(
    stageId: string,
    categoryId: string,
    userId: string,
    batteryIndex?: number,
  ): Promise<void> {
    const params = batteryIndex !== undefined ? { batteryIndex } : {};
    await api.delete(
      `${this.baseUrl}/stage/${stageId}/category/${categoryId}/user/${userId}`,
      { params },
    );
  }

  static async deleteLapTimesByCategoryAndBattery(
    stageId: string,
    categoryId: string,
    batteryIndex: number,
  ): Promise<void> {
    await api.delete(
      `${this.baseUrl}/stage/${stageId}/category/${categoryId}/battery/${batteryIndex}`,
    );
  }

  // Métodos utilitários
  static parseTimeToMs(timeString: string): number {
    try {
      const parts = timeString.split(":");
      let totalMs = 0;

      if (parts.length === 2) {
        // MM:SS.sss
        const minutes = parseInt(parts[0]);
        const secondsParts = parts[1].split(".");
        const seconds = parseInt(secondsParts[0]);
        const milliseconds = parseInt(
          secondsParts[1]?.padEnd(3, "0").substring(0, 3) || "0",
        );

        totalMs = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
      } else if (parts.length === 3) {
        // HH:MM:SS.sss
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const secondsParts = parts[2].split(".");
        const seconds = parseInt(secondsParts[0]);
        const milliseconds = parseInt(
          secondsParts[1]?.padEnd(3, "0").substring(0, 3) || "0",
        );

        totalMs =
          hours * 60 * 60 * 1000 +
          minutes * 60 * 1000 +
          seconds * 1000 +
          milliseconds;
      }

      return totalMs;
    } catch (error) {
      return 0;
    }
  }

  static formatMsToTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }

  static getBestLapTime(lapTimes: LapTime[]): LapTime | null {
    if (!lapTimes || lapTimes.length === 0) return null;

    return lapTimes.reduce((best, current) =>
      current.timeMs < best.timeMs ? current : best,
    );
  }

  static getAverageLapTime(lapTimes: LapTime[]): number | null {
    if (!lapTimes || lapTimes.length === 0) return null;

    const totalMs = lapTimes.reduce((sum, lap) => sum + lap.timeMs, 0);
    return totalMs / lapTimes.length;
  }

  static getTotalTime(lapTimes: LapTime[]): number {
    if (!lapTimes || lapTimes.length === 0) return 0;

    return lapTimes.reduce((sum, lap) => sum + lap.timeMs, 0);
  }

  static processExcelData(data: any[]): {
    kartNumber: number;
    lapNumber: number;
    lapTime: string;
  }[] {
    const result: {
      kartNumber: number;
      lapNumber: number;
      lapTime: string;
    }[] = [];

    // Encontrar onde está o cabeçalho com '#', 'VLT', 'TV'
    let headerIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any[];
      if (row && row.length > 0) {
        // Procurar por linha que contenha '#', 'VLT', 'TV'
        const hasHash = row.some((cell: any) => String(cell).trim() === "#");
        const hasVLT = row.some(
          (cell: any) => String(cell).trim().toUpperCase() === "VLT",
        );
        const hasTV = row.some(
          (cell: any) => String(cell).trim().toUpperCase() === "TV",
        );

        if (hasHash && hasVLT && hasTV) {
          headerIndex = i;
          break;
        }
      }
    }

    if (headerIndex === -1) {
      throw new Error('Cabeçalho com "#", "VLT", "TV" não encontrado');
    }

    // Identificar as colunas do cabeçalho
    const headerRow = data[headerIndex] as any[];
    let kartColumn = -1;
    let lapColumn = -1;
    let timeColumn = -1;

    for (let j = 0; j < headerRow.length; j++) {
      const cell = String(headerRow[j]).trim().toUpperCase();
      if (cell === "#") kartColumn = j;
      if (cell === "VLT") lapColumn = j;
      if (cell === "TV") timeColumn = j;
    }

    if (kartColumn === -1 || lapColumn === -1 || timeColumn === -1) {
      throw new Error("Não foi possível identificar as colunas #, VLT, TV");
    }

    // Processar as linhas de dados (começando após o cabeçalho)
    for (let i = headerIndex + 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;

      const kartNumber = row[kartColumn];
      const lapNumber = row[lapColumn];
      const lapTime = row[timeColumn];

      if (kartNumber && lapNumber && lapTime) {
        // Validar se são dados válidos
        const kartNum = Number(kartNumber);
        const lapNum = Number(lapNumber);
        const timeStr = String(lapTime).trim();

        if (!isNaN(kartNum) && !isNaN(lapNum) && timeStr) {
          result.push({
            kartNumber: kartNum,
            lapNumber: lapNum,
            lapTime: timeStr,
          });
        }
      }
    }

    return result;
  }
}
