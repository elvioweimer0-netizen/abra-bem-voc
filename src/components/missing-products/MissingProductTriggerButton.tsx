import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";
import { MissingProductQuickModal } from "./MissingProductQuickModal";

export function MissingProductTriggerButton({
  variant = "outline",
  fullWidth = true,
}: { variant?: "default" | "outline" | "secondary"; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="lg"
        variant={variant}
        onClick={() => setOpen(true)}
        className={fullWidth ? "w-full justify-center gap-2" : "gap-2"}
      >
        <PackageSearch className="h-5 w-5" />
        Sugerir produto faltando
      </Button>
      <MissingProductQuickModal open={open} onOpenChange={setOpen} />
    </>
  );
}
