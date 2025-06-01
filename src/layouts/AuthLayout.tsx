import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md">
            {/* Logo/Brand */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary">BRK</h1>
              <p className="text-muted-foreground mt-2">
                Plataforma de Gerenciamento de Campeonatos
              </p>
            </div>
            
            {/* Auth Form Container */}
            <div className="bg-card border rounded-lg shadow-lg p-6">
              <Outlet />
            </div>
            
            {/* Footer */}
            <div className="text-center mt-8 text-sm text-muted-foreground">
              <p>&copy; 2024 BRK. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 