import React, { createContext, useContext, useState } from "react";
import type { Enums } from "@/integrations/supabase/types";

type Role = Enums<"cargo_tipo">;
type Unidade = Enums<"unidade_tipo">;

type ViewAsContextType = {
  role: Role | null;
  setRole: (role: Role | null) => void;
  unidade: Unidade;
  setUnidade: (unidade: Unidade) => void;
  isSimulating: boolean;
  clearSimulation: () => void;
};

const ViewAsContext = createContext<ViewAsContextType | null>(null);

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [unidade, setUnidade] = useState<Unidade>("CIDADE ALTA");

  return (
    <ViewAsContext.Provider
      value={{
        role,
        setRole,
        unidade,
        setUnidade,
        isSimulating: role !== null,
        clearSimulation: () => setRole(null),
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) throw new Error("useViewAs must be used inside ViewAsProvider");
  return context;
}
