'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

// Touch gesture hook for swipe detection
export const useSwipeGestures = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchEndRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchEndRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return

    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }
    }

    // Reset
    touchStartRef.current = null
    touchEndRef.current = null
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}

// Swipeable Image Gallery Component
interface SwipeableGalleryProps {
  images: string[]
  alt?: string
  className?: string
  onImageChange?: (index: number) => void
}

export function SwipeableGallery({ 
  images, 
  alt = 'Product image',
  className = '',
  onImageChange 
}: SwipeableGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextImage = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
    onImageChange?.(newIndex)
    
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const prevImage = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    onImageChange?.(newIndex)
    
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const swipeGestures = useSwipeGestures(nextImage, prevImage)

  if (!images || images.length === 0) return null

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onTouchStart={swipeGestures.onTouchStart}
      onTouchMove={swipeGestures.onTouchMove}
      onTouchEnd={swipeGestures.onTouchEnd}
    >
      {/* Images */}
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} className="w-full flex-shrink-0">
            <img
              src={image}
              alt={`${alt} ${index + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => !isTransitioning && setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows for larger screens */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors md:block hidden"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors md:block hidden"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

// Pull to Refresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  threshold?: number
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className = ''
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canPull, setCanPull] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY
        setCanPull(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return

      const currentY = e.touches[0].clientY
      const distance = Math.max(0, (currentY - startY.current) * 0.5)

      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault()
        setPullDistance(Math.min(distance, threshold * 1.5))
      }
    }

    const handleTouchEnd = async () => {
      if (!canPull) return

      setCanPull(false)

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        
        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh failed:', error)
        } finally {
          setIsRefreshing(false)
        }
      }

      setPullDistance(0)
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [canPull, pullDistance, threshold, isRefreshing, onRefresh])

  const refreshProgress = Math.min(pullDistance / threshold, 1)
  const showRefreshIndicator = pullDistance > 10

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ 
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        transition: canPull ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      {showRefreshIndicator && (
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex flex-col items-center justify-center p-4"
          style={{ opacity: refreshProgress }}
        >
          <div className={`w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full ${
            isRefreshing ? 'animate-spin' : ''
          }`} style={{
            transform: `rotate(${refreshProgress * 360}deg)`
          }} />
          
          <span className="text-sm text-secondary-600 mt-2">
            {isRefreshing ? 'Refreshing...' : 
             pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      )}

      {children}
    </div>
  )
}

// Touch-friendly Button Component
interface TouchButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function TouchButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = 'relative touch-manipulation select-none transition-all duration-150 font-semibold rounded-lg flex items-center justify-center'
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-secondary-200 text-secondary-800 hover:bg-secondary-300 active:bg-secondary-400',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100'
  }

  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-3 text-base',
    lg: 'min-h-[52px] px-6 py-4 text-lg'
  }

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer'

  const pressedClasses = isPressed && !disabled ? 'scale-95' : ''

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${pressedClasses} ${className}`}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Long Press Hook
export const useLongPress = (
  onLongPress: () => void,
  delay: number = 500
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const start = () => {
    timerRef.current = setTimeout(onLongPress, delay)
  }

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear
  }
}