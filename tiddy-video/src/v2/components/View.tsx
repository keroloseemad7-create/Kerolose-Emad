import React from 'react';
import {Img} from 'remotion';
import {viewSrc, viewW, ViewName} from '../config';

/** One of the cut-out reference views, sized by height. */
export const View: React.FC<{name: ViewName; height: number; style?: React.CSSProperties; filter?: string}> = ({
  name,
  height,
  style,
  filter,
}) => <Img src={viewSrc(name)} style={{width: viewW(name, height), height, display: 'block', filter, ...style}} />;

/** Soft contact shadow on the ground under a character. */
export const GroundShadow: React.FC<{x: number; y: number; w: number; opacity?: number; squash?: number}> = ({
  x,
  y,
  w,
  opacity = 0.8,
  squash = 0.16,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - (w * squash) / 2,
      width: w,
      height: w * squash,
      borderRadius: '50%',
      background: `radial-gradient(ellipse, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,${opacity * 0.5}) 40%, rgba(0,0,0,0) 72%)`,
    }}
  />
);

/** Depth-of-field: layers further from the focal scale get blurrier. */
export const dof = (scale: number, focus = 1, k = 6) => Math.min(14, Math.abs(Math.log2(scale / focus)) * k);
