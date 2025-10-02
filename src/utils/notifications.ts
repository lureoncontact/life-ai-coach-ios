export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: false,
      ...options,
    });

    // Auto-close after 5 seconds if not interacted with
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
  return null;
};

export const scheduleReminder = (
  time: string,
  callback: () => void
): NodeJS.Timeout | null => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );

  // If the time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilReminder = scheduledTime.getTime() - now.getTime();

  return setTimeout(() => {
    callback();
    // Reschedule for next day
    scheduleReminder(time, callback);
  }, timeUntilReminder);
};

// Notification templates for common actions
export const notifyGoalCompleted = (goalTitle: string) => {
  sendNotification('¡Meta completada! 🎉', {
    body: `Has completado: "${goalTitle}"`,
    tag: 'goal-completed',
  });
};

export const notifyStreakMilestone = (streakDays: number) => {
  sendNotification(`¡Racha de ${streakDays} días! 🔥`, {
    body: '¡Sigue así! Tu consistencia es impresionante.',
    tag: 'streak-milestone',
  });
};

export const notifyLevelUp = (newLevel: number) => {
  sendNotification(`¡Nivel ${newLevel} alcanzado! ⭐`, {
    body: 'Has subido de nivel. ¡Sigue creciendo!',
    tag: 'level-up',
  });
};

export const notifyAchievementUnlocked = (achievementName: string) => {
  sendNotification('¡Nuevo logro desbloqueado! 🏆', {
    body: achievementName,
    tag: 'achievement-unlocked',
  });
};
