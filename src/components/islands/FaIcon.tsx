import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

/** React twin of Icon.astro for the islands. */
export function FaIcon({ icon, size = 20, className }: { icon: IconDefinition; size?: number; className?: string }) {
  const [w, h, , , path] = icon.icon;
  const paths = Array.isArray(path) ? path : [path];
  return (
    <svg className={className} width={Math.round((size * w) / h)} height={size} viewBox={`0 0 ${w} ${h}`} fill="currentColor" aria-hidden="true" focusable="false">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
