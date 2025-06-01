import { RouterProvider } from 'react-router-dom';
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
        </ChampionshipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
