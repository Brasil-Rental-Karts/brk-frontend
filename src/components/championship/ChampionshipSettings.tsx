import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { GridTypesTab } from "./settings/GridTypesTab";
import { Championship } from "@/lib/services/championship.service";

interface ChampionshipSettingsModalProps {
  championship: Championship;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal de configurações do campeonato (DEPRECADO - usar página ChampionshipSettings)
 * Contém diferentes abas para configurações específicas
 */
export const ChampionshipSettingsModal = ({ 
  championship, 
  open, 
  onOpenChange 
}: ChampionshipSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState("grid-types");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] md:max-h-[80vh] overflow-hidden p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl truncate">
            Configurações - {championship.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Gerencie as configurações específicas deste campeonato
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-1 h-auto">
            <TabsTrigger value="grid-types" className="text-sm py-2">
              Tipos de Grid
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 md:mt-6 overflow-y-auto max-h-[calc(90vh-120px)] md:max-h-[60vh]">
            <TabsContent value="grid-types" className="mt-0">
              <GridTypesTab championshipId={championship.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 