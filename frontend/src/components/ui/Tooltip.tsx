import { useState } from 'react'

type TooltipProps = {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={`absolute z-50 w-max max-w-sm rounded-lg bg-slate-800 px-3 py-2.5 text-sm leading-relaxed text-white shadow-xl whitespace-pre-line ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
