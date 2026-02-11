import { getIconPath } from '@/system/icons/iconMap'

interface Win7IconProps {
  name: string
  size?: number
  className?: string
}

export function Win7Icon({ name, size = 32, className = '' }: Win7IconProps) {
  const src = getIconPath(name)
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      draggable={false}
    />
  )
}
