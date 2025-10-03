import { useCallback, useState } from 'react';

// Função utilitária para delay entre requisições
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função utilitária para retry com backoff exponencial
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Tentativa ${attempt + 1} falhou, tentando novamente em ${delayMs}ms...`);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
};

export interface ProgressiveLoadingOptions {
  maxRetries?: number;
  baseDelay?: number;
  requestDelay?: number;
}

export const useProgressiveLoading = (options: ProgressiveLoadingOptions = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    requestDelay = 200
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const executeWithRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    stepName: string
  ): Promise<T> => {
    setCurrentStep(stepName);
    console.log(`🔄 ${stepName}...`);
    
    const result = await retryWithBackoff(fn, maxRetries, baseDelay);
    await delay(requestDelay);
    
    setProgress(prev => prev + 1);
    return result;
  }, [maxRetries, baseDelay, requestDelay]);

  const executeSequence = useCallback(async <T>(
    steps: Array<{
      name: string;
      fn: () => Promise<T>;
    }>
  ): Promise<T[]> => {
    setIsLoading(true);
    setProgress(0);
    setCurrentStep('Iniciando...');

    try {
      const results: T[] = [];
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const result = await executeWithRetry(step.fn, step.name);
        results.push(result);
      }
      
      return results;
    } finally {
      setIsLoading(false);
      setProgress(0);
      setCurrentStep('');
    }
  }, [executeWithRetry]);

  return {
    isLoading,
    progress,
    currentStep,
    executeWithRetry,
    executeSequence,
    delay,
    retryWithBackoff
  };
};
