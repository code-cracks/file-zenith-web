import { cn } from '@/utils/cn';

interface CardItemProps {
  index: number;
  total: number;
  className?: string;
  isExpanded?: boolean;
  isSelected?: boolean;
  onCardClick?: (index: number) => void;
}

const baseClass = cn(
  'absolute w-[240px] h-[360px] bg-[#5e5cfc] rounded-lg flex items-center justify-center',
  'text-transparent text-8xl font-bold border-[10px] border-black/10',
  'transition-all duration-500 origin-bottom cursor-pointer',
  'select-none',
  '[filter:hue-rotate(calc(var(--offset)*60deg))]',
);

const CardItem = ({
  index,
  total,
  className,
  isExpanded,
  isSelected,
  onCardClick,
}: CardItemProps) => {
  const offset = index - Math.floor(total / 2);

  const getTransformStyle = () => {
    const rotate = offset * 3;
    const translateX = offset * 60;
    const translateY = -(5 - offset * offset * 1.5);

    if (isSelected) {
      return {
        transform: `rotate(${rotate}deg) translateX(${translateX}%) translateY(${translateY - 30}%)`,
        zIndex: 100,
      };
    }

    if (isExpanded) {
      return {
        transform: `rotate(${rotate}deg) translateX(${translateX}%) translateY(${translateY}%)`,
      };
    }

    return {
      transform: 'translateX(0) translateY(0) rotate(0deg)',
    };
  };

  return (
    <div
      className={cn(baseClass, className)}
      style={
        {
          ...getTransformStyle(),
          ['--offset' as string]: offset,
        } as React.CSSProperties
      }
      onClick={() => onCardClick?.(index)}
    >
      {index}
    </div>
  );
};

export default CardItem;
