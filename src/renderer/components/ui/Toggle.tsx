import type { HTMLAttributes } from 'react';
import classNames from 'classnames';

interface ToggleProps extends HTMLAttributes<HTMLDivElement> {
  checked: boolean;
}

export const Toggle = ({ checked, className, ...props }: ToggleProps) => (
  <div
    role="switch"
    aria-checked={checked}
    tabIndex={0}
    className={classNames('ds-toggle', checked && 'is-on', className)}
    {...props}
  />
);
