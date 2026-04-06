import { type RefObject, useEffect } from 'react'

/**
 * When `active`, closes on mousedown outside `containerRef` or Escape.
 */
export function useDismissOnOutsideClickAndEscape(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!active) return

    const onDocMouseDown = (e: MouseEvent) => {
      const el = containerRef.current
      if (!el || el.contains(e.target as Node)) return
      onDismiss()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }

    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, containerRef, onDismiss])
}
