type AppIconProps = {
  size?: number
  className?: string
  withBackground?: boolean
  title?: string
}

export function AppIcon({
  size = 96,
  className,
  withBackground = true,
  title = "Closer app icon",
}: AppIconProps) {
  const canvasSize = 500

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${canvasSize} ${canvasSize}`}
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      {withBackground && (
        <rect
          x="0"
          y="0"
          width={canvasSize}
          height={canvasSize}
          rx="110"
          fill="var(--brand-ink-900)"
        />
      )}

      <g transform="matrix(1 0 0 0.9 0 25)">
        <path d="M 172 280 L 250 240 L 328 280 L 308 335 L 192 335 Z" fill="#0A0A0A" />
        <path d="M 172 280 L 192 335 L 122 365 Z" fill="#8B8B8B" />
        <path d="M 328 280 L 308 335 L 378 365 Z" fill="#8B8B8B" />
        <path d="M 192 335 L 308 335 L 308 390 A 58 58 0 0 1 192 390 Z" fill="#383838" />
        <path d="M 250 62 C 218 80, 156 132, 140 218 L 172 280 L 250 240 L 328 280 L 360 218 C 344 132, 282 80, 250 62 Z" fill="#FFFFFF" />
        <circle cx="250" cy="231" r="47" fill="#004DFF" />
        <circle cx="250" cy="231" r="21" fill="#84A9FF" />
      </g>
    </svg>
  )
}
