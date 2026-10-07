import React from 'react';

/** Directional (horizontal) motion-blur filter. Reference with `filter: url(#id)`. */
export const HBlur: React.FC<{id: string; amount: number; vertical?: number}> = ({id, amount, vertical = 0}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={`${Math.max(0, amount)} ${Math.max(0, vertical)}`} />
      </filter>
    </defs>
  </svg>
);
