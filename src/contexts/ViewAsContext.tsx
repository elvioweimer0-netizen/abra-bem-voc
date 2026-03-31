import { createContext, useContext, useState, ReactNode } from "react";
import type { Enums } from "@/integrations/supabase/types";

type CargoTipo = Enums<"cargo_tipo">;
type UnidadeTipo = Enums<"unidade_tipo">;

interface ViewAsContextType {
  simulatedCargo: CargoTipo | null;
  simulatedUnidade: UnidadeTipo | null;
  setSimulatedCargo: (cargo: CargoTipo | null) => void;
  setSimulatedUnidade: (unidade: UnidadeTipo | null) => void;
  isSimulating: boolean;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [simulatedCargo, setSimulatedCargo] = useState<CargoTipo | null>(null);
  const [simulatedUnidade, setSimulatedUnidade] = useState<UnidadeTipo | null>(null);

  return (
    <ViewAsContext.Provider
      value={{
        simulatedCargo,
        simulatedUnidade,
        setSimulatedCargo,
        setSimulatedUnidade,
        isSimulating: simulatedCargo !== null,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) throw new Error("useViewAs must be used within ViewAsProvider");
  return context;
}
