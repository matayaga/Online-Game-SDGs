
import React from 'react';
import { CardType } from '../types';
import { SDG_GOALS } from '../constants';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isSelected?: boolean;
  isNew?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  isSelected, 
  isNew, 
  className = "", 
  size = 'md' 
}) => {
  const goal = SDG_GOALS[card.goalId];
  if (!goal) return null;

  const sizeClasses = {
    sm: "w-12 h-16 text-[8px] p-1 border-2",
    md: "w-24 h-36 md:w-28 md:h-40 p-2 border-4",
    lg: "w-32 h-48 p-4 border-4"
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative ${sizeClasses[size]} ${goal.color} rounded-xl shadow-lg 
        flex flex-col items-center justify-between cursor-pointer transition-all duration-300
        ${isSelected ? 'border-yellow-400 -translate-y-4 scale-105 ring-4 ring-yellow-200' : 'border-white hover:-translate-y-1'}
        ${isNew ? 'animate-[bounce_0.5s_ease-in-out]' : ''}
        ${className}
      `}
    >
      <div className={`text-white font-black drop-shadow-md ${size === 'sm' ? 'text-sm' : 'text-2xl'}`}>
        {goal.id}
      </div>
      <div className={`text-white font-bold text-center leading-tight drop-shadow-sm ${size === 'sm' ? 'text-[6px]' : 'text-xs'}`}>
        {goal.name}
      </div>
      <div className="bg-white/20 w-full h-1/4 rounded-lg flex items-center justify-center backdrop-blur-sm">
        <span className={`text-white font-bold ${size === 'sm' ? 'text-[5px]' : 'text-[10px]'}`}>AGENT</span>
      </div>
      {isNew && <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">NEW</span>}
    </div>
  );
};

export default Card;
