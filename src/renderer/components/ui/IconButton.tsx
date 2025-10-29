import type { ButtonHTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  active?: boolean;
}

export const IconButton = ({ icon, active = false, className, ...props }: IconButtonProps) => (
  <button
    className={classNames('ds-icon-button', active && 'is-active', className)}
    type="button"
    {...props}
  >
    {icon}
  </button>
);
