import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export const RouteErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            404
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Página não encontrada
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Página Inicial
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }

    if (error.status === 401) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            401
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Acesso não autorizado
          </p>
          <Link
            to="/auth/login"
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Fazer Login
          </Link>
        </div>
      );
    }

    if (error.status === 403) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            403
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Acesso negado</p>
          <Link
            to="/dashboard"
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Voltar à Minha Página
          </Link>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Algo deu errado. Por favor, tente novamente.
      </p>
      <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md max-w-md">
        <summary className="cursor-pointer font-medium">
          Detalhes do erro
        </summary>
        <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </pre>
      </details>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Recarregar Página
      </button>
    </div>
  );
};
