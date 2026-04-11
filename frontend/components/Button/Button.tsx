import React from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  full?: boolean;
  disabled?: boolean;
}

export default function Button({ children, onClick, type = 'button', variant = 'primary', full = false, disabled = false }: Props) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${full ? styles.full : ''}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
