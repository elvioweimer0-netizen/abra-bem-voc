import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { ViewAsProvider } from "@/contexts/ViewAsContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { FloatingBoButton } from "@/components/leadership/FloatingBoButton";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ViewAsProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
            <AppHeader />
            <ScrollArea className="flex-1">
              <main className="px-4 pb-[5.5rem] pt-4 sm:px-6 md:pb-8 md:pt-6 lg:px-8 animate-in fade-in duration-300">
                {children}
              </main>
            </ScrollArea>
            <FloatingBoButton />
            <MobileBottomNav />
          </div>
        </div>
      </SidebarProvider>
    </ViewAsProvider>
  );
}
