import React, { createContext, useContext, useState } from "react";
import type { Enums } from "@/integrations/supabase/types";

type Role = Enums<"cargo_tipo">;
type Unidade = Enums<"unidade_tipo">;

type ViewAsContextType = {
  role: Role;
  setRole: (role: Role) => void;
  unidade: Unidade;
  setUnidade: (unidade: Unidade) => void;
};

const ViewAsContext = createContext<ViewAsContextType | null>(null);

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("colaborador");
  const [unidade, setUnidade] = useState<Unidade>("CIDADE ALTA");

  return (
    <ViewAsContext.Provider value={{ role, setRole, unidade, setUnidade }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) throw new Error("useViewAs must be used inside ViewAsProvider");
  return context;
}
