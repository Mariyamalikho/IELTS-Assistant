
import { Clock } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface TimerDisplayProps {
  timeLeft: number;
  dangerThreshold?: number; // In seconds, default 300 (5 mins)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TimerDisplay({ 
  timeLeft, 
  dangerThreshold = 300,
  size = 'md',
  className = ''
}: TimerDisplayProps) {
  const isDanger = timeLeft > 0 && timeLeft <= dangerThreshold;

  const sizeClasses = {
    sm: 'text-lg px-3 py-1.5',
    md: 'text-xl px-4 py-2',
    lg: 'text-2xl px-5 py-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const baseStyle = isDanger
    ? 'bg-destructive/10 text-destructive animate-pulse'
    : 'bg-primary/10 text-primary';

  return (
    <div className={`flex items-center gap-2 font-mono rounded-md ${sizeClasses[size]} ${baseStyle} ${className}`}>
      <Clock className={iconSizes[size]} />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
