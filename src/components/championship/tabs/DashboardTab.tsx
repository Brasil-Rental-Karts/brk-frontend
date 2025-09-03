import { Card } from "brk-design-system";

interface DashboardTabProps {
  championshipId: string;
}

export const DashboardTab = ({ championshipId }: DashboardTabProps) => {
  return (
    <div className="space-y-6">
      <Card className="w-full p-6">
        {/* Conteúdo inicial em branco */}
      </Card>
    </div>
  );
};


