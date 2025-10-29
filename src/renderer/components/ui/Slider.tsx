import type { InputHTMLAttributes } from 'react';
import classNames from 'classnames';

type SliderProps = InputHTMLAttributes<HTMLInputElement>;

export const Slider = ({ className, ...props }: SliderProps) => (
  <input type="range" className={classNames('ds-slider', className)} {...props} />
);
