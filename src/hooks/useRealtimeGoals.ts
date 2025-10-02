import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  is_completed: boolean;
  is_daily: boolean;
  focus_room_id: string;
}

export const useRealtimeGoals = (
  roomId: string,
  onGoalUpdate: () => void
) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'goals',
          filter: `focus_room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Goal updated:', payload);
          const newGoal = payload.new as Goal;
          
          if (newGoal.is_completed) {
            toast({
              title: "Meta completada en tiempo real",
              description: `"${newGoal.title}" ha sido completada`,
            });
          }
          
          onGoalUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'goals',
          filter: `focus_room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('New goal created:', payload);
          const newGoal = payload.new as Goal;
          
          toast({
            title: "Nueva meta agregada",
            description: `"${newGoal.title}"`,
          });
          
          onGoalUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, onGoalUpdate, toast]);
};