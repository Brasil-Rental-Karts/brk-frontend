import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChampionshipProvider } from '@/contexts/ChampionshipContext';
import { router } from '@/router/router';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="brk-ui-theme">
      <AuthProvider>
        <ChampionshipProvider>
          <RouterProvider router={router} />
          <Toaster 
            position="top-right"
            richColors
            closeButton
            expand={false}
            duration={5000}
          />
        </ChampionshipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
