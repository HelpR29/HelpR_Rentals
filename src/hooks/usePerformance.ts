import { useEffect, useCallback, useRef, useState } from 'react'

// Performance optimization hooks

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Lazy loading hook for images
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = useState<string>()
  const [imageRef, setImageRef] = useState<HTMLImageElement>()
  const isIntersecting = useIntersectionObserver(
    { current: imageRef },
    { threshold: 0.1 }
  )

  useEffect(() => {
    if (isIntersecting && src) {
      setImageSrc(src)
    }
  }, [isIntersecting, src])

  return [setImageRef, imageSrc] as const
}

// Performance monitoring
export function usePerformanceMonitor() {
  const startTime = useRef<number>()

  const startMeasure = useCallback((name: string) => {
    startTime.current = performance.now()
    performance.mark(`${name}-start`)
  }, [])

  const endMeasure = useCallback((name: string) => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      // Log slow operations in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
    return 0
  }, [])

  return { startMeasure, endMeasure }
}

// Missing import
import { useState } from 'react'
