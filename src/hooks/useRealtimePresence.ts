import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  userId: string;
  userName: string;
  joinedAt: string;
}

export const useRealtimePresence = (roomId: string, userName: string) => {
  const [activeUsers, setActiveUsers] = useState<PresenceState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !roomId) return;

      const userId = user.id;
      const roomChannel = supabase.channel(`room:${roomId}`);

      roomChannel
        .on('presence', { event: 'sync' }, () => {
          const state = roomChannel.presenceState();
          const users: PresenceState[] = [];
          
          Object.keys(state).forEach((key) => {
            const presences = state[key] as unknown as PresenceState[];
            presences.forEach((presence) => {
              users.push(presence);
            });
          });
          
          setActiveUsers(users);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await roomChannel.track({
              userId,
              userName,
              joinedAt: new Date().toISOString(),
            });
          }
        });

      setChannel(roomChannel);
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, userName]);

  return { activeUsers, activeCount: activeUsers.length };
};