import React from 'react';
import styles from './Input.module.css';

interface Props {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export default function Input({ label, name, type = 'text', value, onChange, placeholder, required }: Props) {
  return (
    <div className={styles.group}>
      <label className={styles.label} htmlFor={name}>{label}</label>
      <input
        className={styles.field}
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
