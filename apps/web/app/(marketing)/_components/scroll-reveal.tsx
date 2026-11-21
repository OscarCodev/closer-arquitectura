'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale'

type ScrollRevealProps = {
  children: ReactNode
  direction?: RevealDirection
  delay?: number
  duration?: number
  distance?: number
  className?: string
  once?: boolean
  threshold?: number
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  distance = 40,
  className = '',
  once = true,
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(element)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [once, threshold])

  const transforms: Record<RevealDirection, string> = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    scale: `scale(0.92)`,
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) translateX(0) scale(1)' : transforms[direction],
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/* Staggered children — wraps each child in a ScrollReveal with incremental delays */
type StaggerRevealProps = {
  children: ReactNode[]
  direction?: RevealDirection
  baseDelay?: number
  stagger?: number
  duration?: number
  className?: string
  childClassName?: string
}

export function StaggerReveal({
  children,
  direction = 'up',
  baseDelay = 0,
  stagger = 120,
  duration = 650,
  className = '',
  childClassName = '',
}: StaggerRevealProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollReveal
          key={i}
          direction={direction}
          delay={baseDelay + i * stagger}
          duration={duration}
          className={childClassName}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  )
}
