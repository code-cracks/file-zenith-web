import { useState } from 'react';

import CardItem from './item';

const Drizzt = () => {
  const total = 9;
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());

  const handleExpand = () => {
    setIsExpanded(!isExpanded);

    // 收起时清空选中的卡牌
    if (isExpanded) {
      setSelectedCards(new Set());
    }
  };

  const handleCardClick = (index: number) => {
    if (!isExpanded) return;
    setSelectedCards((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  return (
    <div className="w-full h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
      <button
        onClick={handleExpand}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        {isExpanded ? '收起卡牌' : '展开卡牌'}
      </button>
      <div className="w-full h-[400px] flex items-center justify-center relative">
        {Array.from({ length: total }).map((_, index) => (
          <CardItem
            key={index}
            index={index}
            total={total}
            isExpanded={isExpanded}
            isSelected={selectedCards.has(index)}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
      {selectedCards.size > 0 && (
        <div className="mt-4 text-lg">
          选中的卡牌:{' '}
          {Array.from(selectedCards)
            .map((i) => i + 1)
            .join(', ')}
        </div>
      )}
    </div>
  );
};

export default Drizzt;
