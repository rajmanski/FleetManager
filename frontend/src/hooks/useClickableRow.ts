import { useNavigate } from 'react-router-dom'
import type { KeyboardEvent } from 'react'

export function useClickableRow() {
  const navigate = useNavigate()

  const getRowProps = (destinationOrCallback: string | (() => void), ariaLabel?: string) => {
    const handleClick = () => {
      if (typeof destinationOrCallback === 'function') {
        destinationOrCallback()
      } else {
        navigate(destinationOrCallback)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    }

    return {
      role: 'link' as const,
      tabIndex: 0,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
    }
  }

  return { getRowProps }
}
