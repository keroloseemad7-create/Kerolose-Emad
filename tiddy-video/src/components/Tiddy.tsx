import React from 'react';
import {Img, staticFile} from 'remotion';
import {TIDDY_RIDE} from '../theme';

/** The cut-out Tiddy on his chopper, sized by height. Origin = top-left of the image box. */
export const Tiddy: React.FC<{height: number; style?: React.CSSProperties; filter?: string}> = ({height, style, filter}) => {
  const width = (height * TIDDY_RIDE.w) / TIDDY_RIDE.h;
  return (
    <Img
      src={staticFile(TIDDY_RIDE.src)}
      style={{width, height, display: 'block', filter, ...style}}
    />
  );
};

export const tiddyWidth = (height: number) => (height * TIDDY_RIDE.w) / TIDDY_RIDE.h;
