interface GridBgProps {
  size?: number;
  opacity?: number;
}

export function GridBg({ size = 60, opacity = 0.05 }: GridBgProps) {
  const d = `M ${size} 0 L 0 0 0 ${size}`;
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ opacity }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-bg" width={size} height={size} patternUnits="userSpaceOnUse">
            <path d={d} fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-bg)" />
      </svg>
    </div>
  );
}
