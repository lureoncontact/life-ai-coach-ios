import { Target, Zap, TrendingUp, Award, Star, Flame, Book, Headphones, Dumbbell, Brain, Heart, MessageCircle, Camera, Music, Trophy, Crown, Sparkles, Rocket, Diamond, Medal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NodePosition {
  x: number; // percentage from left
  y: number; // pixels from top
}

export const getNodePositions = (totalLevels: number): NodePosition[] => {
  const positions: NodePosition[] = [];
  const verticalSpacing = 180; // pixels between levels
  
  for (let i = 0; i < totalLevels; i++) {
    let x: number;
    
    // Zigzag pattern: center -> left -> right -> center -> far left -> far right
    const pattern = i % 6;
    switch (pattern) {
      case 0: x = 50; break;  // center
      case 1: x = 25; break;  // left
      case 2: x = 75; break;  // right
      case 3: x = 50; break;  // center
      case 4: x = 15; break;  // far left
      case 5: x = 85; break;  // far right
      default: x = 50;
    }
    
    positions.push({
      x,
      y: i * verticalSpacing + 50
    });
  }
  
  return positions;
};

export const getLevelIcon = (level: number): LucideIcon => {
  const icons: LucideIcon[] = [
    Target, Zap, TrendingUp, Award, Star,
    Flame, Book, Headphones, Dumbbell, Brain,
    Heart, MessageCircle, Camera, Music, Trophy,
    Crown, Sparkles, Rocket, Diamond, Medal
  ];
  
  return icons[(level - 1) % icons.length];
};

export const getLevelTitle = (level: number): string => {
  if (level <= 5) return "Principiante";
  if (level <= 10) return "Comprometido";
  if (level <= 15) return "Dedicado";
  if (level <= 20) return "Maestro";
  return "Leyenda";
};

export const getSectionName = (level: number): string => {
  if (level <= 5) return "Fundamentos";
  if (level <= 10) return "Construcción de Hábitos";
  if (level <= 15) return "Transformación";
  if (level <= 20) return "Excelencia";
  return "Leyenda";
};

export const calculatePointsForLevel = (level: number): number => {
  return level * 100; // Simple formula
};
