import type { AvatarStyle } from '@/context/AuthContext';

export const AVATAR_BG_OPTIONS: { id: string; label: string; class: string }[] = [
  { id: 'indigo', label: 'Indigo', class: 'bg-indigo-600' },
  { id: 'sky', label: 'Sky', class: 'bg-sky-500' },
  { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { id: 'slate', label: 'Slate', class: 'bg-slate-700' },
];

export const AVATAR_GRADIENT_OPTIONS: { id: string; label: string; class: string }[] = [
  { id: 'none', label: 'None', class: '' },
  { id: 'indigo-sky', label: 'Indigo → Sky', class: 'bg-gradient-to-br from-indigo-500 to-sky-400' },
  { id: 'emerald-teal', label: 'Emerald → Teal', class: 'bg-gradient-to-br from-emerald-500 to-teal-400' },
  { id: 'rose-amber', label: 'Rose → Amber', class: 'bg-gradient-to-br from-rose-500 to-amber-400' },
  { id: 'slate-zinc', label: 'Slate → Zinc', class: 'bg-gradient-to-br from-slate-600 to-zinc-500' },
];

export const AVATAR_TEXT_OPTIONS: { id: string; label: string; class: string }[] = [
  { id: 'white', label: 'White', class: 'text-white' },
  { id: 'slate-900', label: 'Dark', class: 'text-slate-900' },
  { id: 'indigo-100', label: 'Light Indigo', class: 'text-indigo-100' },
];

export const AVATAR_SHAPE_OPTIONS: { id: AvatarStyle['shape']; label: string; class: string }[] = [
  { id: 'circle', label: 'Circle', class: 'rounded-full' },
  { id: 'rounded', label: 'Rounded', class: 'rounded-xl' },
  { id: 'square', label: 'Square', class: 'rounded-none' },
];

export const AVATAR_RING_OPTIONS: { id: AvatarStyle['ring']; label: string; class: string }[] = [
  { id: 'none', label: 'None', class: '' },
  { id: 'indigo', label: 'Indigo', class: 'ring-2 ring-indigo-500/40' },
  { id: 'white', label: 'White', class: 'ring-2 ring-white/30' },
  { id: 'dark', label: 'Dark', class: 'ring-2 ring-slate-900/40' },
];

export const AVATAR_SIZE_OPTIONS: { id: AvatarStyle['size']; label: string; class: string; textClass: string }[] = [
  { id: 'sm', label: 'Small', class: 'h-8 w-8', textClass: 'text-xs' },
  { id: 'md', label: 'Medium', class: 'h-10 w-10', textClass: 'text-sm' },
  { id: 'lg', label: 'Large', class: 'h-12 w-12', textClass: 'text-base' },
];

export const AVATAR_FONT_OPTIONS: { id: AvatarStyle['font']; label: string; class: string }[] = [
  { id: 'normal', label: 'Normal', class: 'font-medium' },
  { id: 'bold', label: 'Bold', class: 'font-bold' },
  { id: 'mono', label: 'Mono', class: 'font-mono font-semibold' },
];

export function avatarInitial(email: string) {
  const letter = email.trim().charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

function classFor(id: string, options: { id: string; class: string }[]): string {
  return options.find((o) => o.id === id)?.class ?? options[0].class;
}

export function avatarClasses(style: AvatarStyle, sizeClass?: string) {
  const bg = style.gradient && style.gradient !== 'none'
    ? classFor(style.gradient, AVATAR_GRADIENT_OPTIONS)
    : classFor(style.bg, AVATAR_BG_OPTIONS);
  const text = classFor(style.text, AVATAR_TEXT_OPTIONS);
  const shape = AVATAR_SHAPE_OPTIONS.find((o) => o.id === style.shape)?.class ?? 'rounded-full';
  const ring = AVATAR_RING_OPTIONS.find((o) => o.id === style.ring)?.class ?? '';
  const size = sizeClass ?? AVATAR_SIZE_OPTIONS.find((o) => o.id === style.size)?.class ?? 'h-10 w-10';
  const textClass = AVATAR_SIZE_OPTIONS.find((o) => o.id === style.size)?.textClass ?? 'text-sm';
  const font = AVATAR_FONT_OPTIONS.find((o) => o.id === style.font)?.class ?? 'font-bold';
  const shadow = style.shadow ? 'shadow-lg shadow-black/30' : '';
  return `${bg} ${text} ${shape} ${ring} ${size} ${textClass} ${font} ${shadow} flex items-center justify-center shrink-0`;
}
