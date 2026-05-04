import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircleWarning } from "lucide-react";
import { ComplaintQuickModal } from "./ComplaintQuickModal";

export function ComplaintTriggerButton({
  variant = "default",
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
        <MessageCircleWarning className="h-5 w-5" />
        Registrar reclamação de cliente
      </Button>
      <ComplaintQuickModal open={open} onOpenChange={setOpen} />
    </>
  );
}
