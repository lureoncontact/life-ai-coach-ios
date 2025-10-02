import { useEffect, useState } from "react";
import { Trophy, Star, Sparkles } from "lucide-react";

interface CelebrationEffectProps {
  show: boolean;
  type?: "achievement" | "levelup" | "streak";
  onComplete?: () => void;
}

const CelebrationEffect = ({ show, type = "achievement", onComplete }: CelebrationEffectProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Create confetti particles
      createConfetti();
      
      // Hide after animation
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const createConfetti = () => {
    const colors = ['#48B8A9', '#F4A28A', '#68D391', '#F6E05E', '#E57373'];
    const container = document.getElementById('confetti-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-particle';
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}vw;
        top: -20px;
        opacity: 1;
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        z-index: 9999;
      `;
      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }
  };

  if (!visible) return null;

  const icons = {
    achievement: <Trophy className="w-16 h-16 text-primary" />,
    levelup: <Star className="w-16 h-16 text-yellow-500" />,
    streak: <Sparkles className="w-16 h-16 text-orange-500" />,
  };

  const messages = {
    achievement: "¡Logro Desbloqueado!",
    levelup: "¡Nivel Alcanzado!",
    streak: "¡Racha Épica!",
  };

  return (
    <>
      <style>
        {`
          @keyframes confetti-fall {
            to {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
          
          @keyframes celebration-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}
      </style>
      
      <div
        id="confetti-container"
        className="fixed inset-0 pointer-events-none z-[9999]"
      />
      
      <div className="fixed inset-0 flex items-center justify-center z-[9998] pointer-events-none animate-fade-in">
        <div
          className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-primary animate-scale-in"
          style={{ animation: 'celebration-bounce 0.6s ease-out' }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="animate-pulse-glow rounded-full p-4 bg-primary/10">
              {icons[type]}
            </div>
            <h2 className="text-3xl font-bold text-center">{messages[type]}</h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default CelebrationEffect;
