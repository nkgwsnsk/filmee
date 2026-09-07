import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  initialRating?: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

export const StarRating = ({ initialRating = 0, readonly = false, onChange }: Props) => {
  const [hover, setHover] = useState<number | null>(null);
  const [rating, setRating] = useState(initialRating);

  const displayRating = hover !== null ? hover : rating;

  return (
    // inline-flex を使い、明示的に flex-row (横並び) を指定します
    <div className="flex flex-row items-center gap-4 w-full">
      <div 
        className="flex flex-row" 
        onMouseLeave={() => !readonly && setHover(null)}
      >
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          const isFull = displayRating >= starValue;
          const isHalf = displayRating === starValue - 0.5;

          return (
            <button
              type="button"
              aria-label={`${starValue}つ星を選択`}
              key={i}
              className={`relative ${readonly ? '' : 'cursor-pointer'}`}
              style={{ width: '32px', height: '32px', minWidth: '32px' }} 
              onMouseMove={(e) => {
                if (readonly) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                // 半分より左なら .5、右なら整数
                setHover(x < rect.width / 2 ? starValue - 0.5 : starValue);
              }}
              onClick={() => {
                if (readonly || !onChange) return;
                setRating(displayRating);
                onChange(displayRating);
              }}
            >
              {/* 背景の星 */}
              <div className="absolute inset-0">
                <Star className="text-gray-300 fill-gray-300 w-8 h-8" />
              </div>
              
              {/* 塗りの星：絶対配置で重ねる */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: isFull ? '100%' : isHalf ? '50%' : '0%' }}
              >
                <Star className="text-yellow-400 fill-yellow-400 w-8 h-8" />
              </div>
            </button>
          );
        })}
      </div>
      
      {/* 数値表示 */}
      <div className="flex items-center bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
        <span className="text-xl font-bold text-blue-700 tabular-nums">
          {displayRating.toFixed(1)}
        </span>
        <span className="text-xs text-blue-400 ml-1">/ 5.0</span>
      </div>
    </div>
  );
};