import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { ViewAsProvider } from "@/contexts/ViewAsContext";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ViewAsProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
            <AppHeader />
            <ScrollArea className="flex-1">
              <main className="p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
                {children}
              </main>
            </ScrollArea>
          </div>
        </div>
      </SidebarProvider>
    </ViewAsProvider>
  );
}
