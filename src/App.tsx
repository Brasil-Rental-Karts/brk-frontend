import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { router } from '@/router/router';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="brk-ui-theme">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
