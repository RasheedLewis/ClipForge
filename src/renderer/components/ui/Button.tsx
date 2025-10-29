import type { ButtonHTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'ghost' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = ({
  variant = 'primary',
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonProps) => {
  const classes = classNames(
    'ds-button',
    {
      'ds-button--ghost': variant === 'ghost',
      'ds-button--icon': variant === 'icon',
    },
    className,
  );

  return (
    <button className={classes} {...props}>
      {leftIcon}
      {variant !== 'icon' ? children : null}
      {rightIcon}
    </button>
  );
};
