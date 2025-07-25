import { useCallback } from "react";

import { Sentry } from "@/lib/sentry";

export function useSentry() {
  const captureException = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      Sentry.captureException(error, context);
    },
    [],
  );

  const captureMessage = useCallback(
    (message: string, level: "info" | "warning" | "error" = "info") => {
      Sentry.captureMessage(message, level);
    },
    [],
  );

  const setUser = useCallback(
    (user: { id: string; email?: string; username?: string }) => {
      Sentry.setUser(user);
    },
    [],
  );

  const setTag = useCallback((key: string, value: string) => {
    Sentry.setTag(key, value);
  }, []);

  const setContext = useCallback(
    (name: string, context: Record<string, unknown>) => {
      Sentry.setContext(name, context);
    },
    [],
  );

  const addBreadcrumb = useCallback(
    (breadcrumb: {
      message: string;
      category?: string;
      level?: "info" | "warning" | "error";
      data?: Record<string, unknown>;
    }) => {
      Sentry.addBreadcrumb(breadcrumb);
    },
    [],
  );

  return {
    captureException,
    captureMessage,
    setUser,
    setTag,
    setContext,
    addBreadcrumb,
  };
}
