import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { SentryErrorBoundary } from "@/components/SentryErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChampionshipProvider } from "@/contexts/ChampionshipContext";
import { UserProvider } from "@/contexts/UserContext";
import { router } from "@/router/router";

function App() {
  return (
    <SentryErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="brk-ui-theme">
        <AuthProvider>
          <ChampionshipProvider>
            <UserProvider>
              <RouterProvider router={router} />
              <Toaster
                position="top-right"
                richColors
                closeButton
                expand={false}
                duration={5000}
              />
            </UserProvider>
          </ChampionshipProvider>
        </AuthProvider>
      </ThemeProvider>
    </SentryErrorBoundary>
  );
}

export default App;
