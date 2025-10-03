import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BarChart3, Settings, TrendingUp } from "lucide-react";

const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 mt-6">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation("/progress")}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Progreso
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation("/stats")}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Estadísticas
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigation("/settings")}
          >
            <Settings className="w-5 h-5 mr-2" />
            Configuración
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
