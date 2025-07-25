import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface RouteMetadata {
  title?: string;
  description?: string;
  keywords?: string;
}

// Route metadata mapping
const routeMetadata: Record<string, RouteMetadata> = {
  "/auth/login": {
    title: "Login - BRK",
    description: "Faça login na plataforma BRK para gerenciar seus campeonatos",
    keywords: "login, autenticação, BRK, campeonatos",
  },
  "/auth/register": {
    title: "Cadastro - BRK",
    description: "Crie sua conta na plataforma BRK",
    keywords: "cadastro, registro, BRK, campeonatos",
  },
  "/auth/reset-password": {
    title: "Redefinir Senha - BRK",
    description: "Redefina sua senha de acesso à plataforma BRK",
    keywords: "redefinir senha, recuperar senha, BRK",
  },
  "/dashboard": {
    title: "Dashboard - BRK",
    description: "Painel principal da plataforma BRK",
    keywords: "dashboard, painel, BRK, campeonatos",
  },
  "/create-championship": {
    title: "Criar Campeonato - BRK",
    description: "Crie um novo campeonato na plataforma BRK",
    keywords: "criar campeonato, novo campeonato, BRK",
  },
  "/change-password": {
    title: "Alterar Senha - BRK",
    description: "Altere sua senha de acesso",
    keywords: "alterar senha, configurações, BRK",
  },
};

export const useRouteMetadata = () => {
  const location = useLocation();

  useEffect(() => {
    const metadata = routeMetadata[location.pathname];

    if (metadata) {
      // Update document title
      if (metadata.title) {
        document.title = metadata.title;
      }

      // Update meta description
      if (metadata.description) {
        let metaDescription = document.querySelector(
          'meta[name="description"]',
        );
        if (!metaDescription) {
          metaDescription = document.createElement("meta");
          metaDescription.setAttribute("name", "description");
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute("content", metadata.description);
      }

      // Update meta keywords
      if (metadata.keywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement("meta");
          metaKeywords.setAttribute("name", "keywords");
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute("content", metadata.keywords);
      }
    } else {
      // Default title for unknown routes
      document.title = "BRK - Plataforma de Gerenciamento de Campeonatos";
    }
  }, [location.pathname]);

  return routeMetadata[location.pathname] || null;
};
