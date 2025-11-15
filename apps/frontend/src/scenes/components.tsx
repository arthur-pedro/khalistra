'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

interface ScenePanelProps {
  title: string;
  subtitle?: string;
  accent?: 'ember' | 'aether';
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const ScenePanel = ({ title, subtitle, accent = 'ember', actions, className, children }: ScenePanelProps) => (
  <section
    className={cx(
      'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl',
      'ring-1 ring-inset ring-white/5',
      className
    )}
  >
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className={cx('text-xs uppercase tracking-[0.3em]', accent === 'ember' ? 'text-[var(--color-ember)]' : 'text-[var(--color-aether)]')}>
          {title}
        </p>
        {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
      </div>
      {actions}
    </header>
    <div className="mt-5">{children}</div>
  </section>
);

type SceneButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';

interface SceneButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SceneButtonVariant;
  fullWidth?: boolean;
}

export const SceneButton = ({ variant = 'primary', fullWidth, className, ...props }: SceneButtonProps) => {
  const base = 'rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] transition disabled:opacity-40 disabled:cursor-not-allowed';
  const variants: Record<SceneButtonVariant, string> = {
    primary: 'bg-[var(--color-ember)] text-black hover:bg-[var(--color-ember-strong)]',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    ghost: 'bg-transparent text-white hover:bg-white/10 border border-white/20',
    outline: 'border border-white/40 text-white hover:border-white',
    danger: 'bg-red-500/80 text-white hover:bg-red-500'
  };

  return (
    <button
      className={cx(base, variants[variant], fullWidth && 'w-full text-center', className)}
      {...props}
    />
  );
};

interface SceneInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export const SceneInput = ({ label, hint, className, ...props }: SceneInputProps) => (
  <label className="flex flex-col gap-2">
    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{label}</span>
    <input
      className={cx(
        'w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-[var(--color-ember)] focus:ring-2 focus:ring-[var(--color-ember)]/40',
        className
      )}
      {...props}
    />
    {hint && <span className="text-xs text-white/50">{hint}</span>}
  </label>
);

type SceneTagTone = 'default' | 'positive' | 'warning';

interface SceneTagProps {
  tone?: SceneTagTone;
  children: ReactNode;
}

export const SceneTag = ({ tone = 'default', children }: SceneTagProps) => {
  const tones: Record<SceneTagTone, string> = {
    default: 'bg-white/10 text-white',
    positive: 'bg-emerald-500/20 text-emerald-200',
    warning: 'bg-amber-500/20 text-amber-200'
  };

  return (
    <span className={cx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', tones[tone])}>
      {children}
    </span>
  );
};

interface SceneGridProps {
  columns?: 2 | 3;
  children: ReactNode;
}

export const SceneGrid = ({ columns = 2, children }: SceneGridProps) => (
  <div className={cx('grid gap-4', columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>{children}</div>
);
