import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";

export const Admin = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Painel de Administração</h1>
        <p className="text-muted-foreground mt-2">
          Área administrativa para gerenciamento do sistema
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Painel de Administração</CardTitle>
            <CardDescription>
              Esta área está em desenvolvimento. Em breve você encontrará aqui as ferramentas de administração do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidades em desenvolvimento:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
              <li>Gerenciamento de usuários</li>
              <li>Configurações do sistema</li>
              <li>Relatórios e estatísticas</li>
              <li>Monitoramento de atividades</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 