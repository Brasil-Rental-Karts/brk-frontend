import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChampionshipProvider } from '@/contexts/ChampionshipContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { router } from '@/router/router';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="brk-ui-theme">
      <AuthProvider>
        <ChampionshipProvider>
          <DashboardProvider>
            <RouterProvider router={router} />
            <Toaster 
              position="top-right"
              richColors
              closeButton
              expand={false}
              duration={5000}
            />
          </DashboardProvider>
        </ChampionshipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
