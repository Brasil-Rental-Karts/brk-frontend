import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GridTypesTab } from "./settings/GridTypesTab";
import { Championship } from "@/lib/services/championship.service";

interface ChampionshipSettingsProps {
  championship: Championship;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal de configurações do campeonato
 * Contém diferentes abas para configurações específicas
 */
export const ChampionshipSettings = ({ 
  championship, 
  open, 
  onOpenChange 
}: ChampionshipSettingsProps) => {
  const [activeTab, setActiveTab] = useState("grid-types");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Configurações - {championship.name}</DialogTitle>
          <DialogDescription>
            Gerencie as configurações específicas deste campeonato
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="grid-types">Tipos de Grid</TabsTrigger>
          </TabsList>

          <div className="mt-6 overflow-y-auto max-h-[60vh]">
            <TabsContent value="grid-types" className="mt-0">
              <GridTypesTab championshipId={championship.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 