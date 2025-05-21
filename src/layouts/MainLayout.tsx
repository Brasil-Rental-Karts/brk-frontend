import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">BRK</h1>
          <nav>{/* Adicione aqui os links de navegação */}</nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-muted py-4 px-6">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} BRK. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
