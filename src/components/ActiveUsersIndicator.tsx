import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PresenceState {
  userId: string;
  userName: string;
  joinedAt: string;
}

interface ActiveUsersIndicatorProps {
  activeUsers: PresenceState[];
  activeCount: number;
}

const ActiveUsersIndicator = ({ activeUsers, activeCount }: ActiveUsersIndicatorProps) => {
  if (activeCount === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const colors = [
    "bg-primary",
    "bg-success",
    "bg-accent",
    "bg-warning",
    "bg-destructive",
  ];

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <Users className="w-4 h-4 text-muted-foreground animate-pulse" />
      <div className="flex -space-x-2">
        <TooltipProvider>
          {activeUsers.slice(0, 3).map((user, index) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger>
                <Avatar className={`w-8 h-8 border-2 border-background ${colors[index % colors.length]} hover-lift animate-fade-in transition-transform hover:scale-110`} style={{ animationDelay: `${index * 100}ms` }}>
                  <AvatarFallback className="text-xs text-white">
                    {getInitials(user.userName)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.userName}</p>
                <p className="text-xs text-muted-foreground">
                  Activo desde {new Date(user.joinedAt).toLocaleTimeString()}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {activeCount > 3 && (
            <Avatar className="w-8 h-8 border-2 border-background bg-muted hover-lift animate-fade-in">
              <AvatarFallback className="text-xs">
                +{activeCount - 3}
              </AvatarFallback>
            </Avatar>
          )}
        </TooltipProvider>
      </div>
      <span className="text-sm text-muted-foreground">
        {activeCount} {activeCount === 1 ? "persona" : "personas"} activa{activeCount === 1 ? "" : "s"}
      </span>
    </div>
  );
};

export default ActiveUsersIndicator;