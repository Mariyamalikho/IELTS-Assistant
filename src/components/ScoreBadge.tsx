

interface ScoreBadgeProps {
  band: number | string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  description?: string;
  className?: string;
}

export function ScoreBadge({ 
  band, 
  size = 'md', 
  title = "Estimated Band Score",
  description = "Based on official IELTS rubrics",
  className = '' 
}: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl'
  };

  const containerClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={`flex items-center gap-4 bg-primary/10 rounded-xl ${containerClasses[size]} ${className}`}>
      <div className={`bg-primary text-primary-foreground font-bold p-3 rounded-full flex items-center justify-center ${sizeClasses[size]}`}>
        <span>{typeof band === 'number' ? band.toFixed(1) : band}</span>
      </div>
      <div>
        <h3 className="font-semibold text-lg text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
