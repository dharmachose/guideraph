export function MountainSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background mountains */}
      <path
        d="M0 120 L80 40 L160 80 L240 20 L320 70 L400 30 L400 120 Z"
        fill="#1A2B3C"
      />
      {/* Mid mountains */}
      <path
        d="M0 120 L60 60 L120 90 L200 30 L280 75 L350 45 L400 65 L400 120 Z"
        fill="#243547"
      />
      {/* Foreground */}
      <path
        d="M0 120 L40 90 L100 110 L180 70 L260 100 L320 80 L400 95 L400 120 Z"
        fill="#0F1923"
      />
      {/* Snow caps */}
      <path
        d="M200 30 L190 50 L210 50 Z"
        fill="white"
        opacity="0.6"
      />
      <path
        d="M350 45 L344 58 L356 58 Z"
        fill="white"
        opacity="0.4"
      />
      <path
        d="M80 40 L73 55 L87 55 Z"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
