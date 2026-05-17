import React, { useEffect, useRef, useState } from 'react'
import { View, Dimensions, PixelRatio } from 'react-native'
import Svg, { Polygon } from 'react-native-svg'

interface Point {
  x: number
  y: number
  ox: number
  oy: number
  phase: number
  speed: number
}

export function TriangleMesh() {
  const viewRef = useRef<View>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const pointsRef = useRef<Point[]>([])
  const rafRef = useRef<number>(0)

  const initPoints = (w: number, h: number) => {
    const points: Point[] = []
    const cols = 9
    const rows = 6
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c / (cols - 1)) * w
        const y = (r / (rows - 1)) * h
        points.push({
          x, y, ox: x, oy: y,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.4,
        })
      }
    }
    pointsRef.current = points
  }

  const draw = (time: number) => {
    // Request next frame
    rafRef.current = requestAnimationFrame(() => draw(time + 1))
  }

  const animate = () => {
    const points = pointsRef.current
    const { width: W, height: H } = size
    if (!points.length || W === 0) return

    const time = Date.now() * 0.001

    // Update points
    points.forEach(p => {
      p.x = p.ox + Math.sin(time * p.speed + p.phase) * 18
      p.y = p.oy + Math.cos(time * p.speed + p.phase) * 12
    })

    // Trigger re-render by updating state
    setSize({ width: W, height: H }) // Triggers re-render

    rafRef.current = requestAnimationFrame(animate)
  }

  const drawTriangle = (a: Point, b: Point, c: Point, index: number) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const opacity = Math.max(0, 1 - dist / 220) * 0.35

    return (
      <Polygon
        key={index}
        points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
        fill={`rgba(234,179,8,${opacity})`}
      />
    )
  }

  const drawEdge = (a: Point, b: Point, index: number) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const opacity = Math.max(0, 1 - dist / 220) * 0.35

    // For edges, we'll use a line (implemented as thin polygon)
    const offset = 0.5
    return (
      <Polygon
        key={`edge-${index}`}
        points={`${a.x},${a.y} ${b.x},${b.y} ${b.x + offset},${b.y + offset} ${a.x + offset},${a.y + offset}`}
        fill={`rgba(234,179,8,${opacity * 0.7})`}
      />
    )
  }

  useEffect(() => {
    const { width, height } = Dimensions.get('window')
    const dpr = PixelRatio.get()
    const w = width * dpr
    const h = height * dpr
    setSize({ width: w, height: h })
    initPoints(w, h)
    
    // Start animation
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout
    const dpr = PixelRatio.get()
    const w = width * dpr
    const h = height * dpr
    if (w !== size.width || h !== size.height) {
      setSize({ width: w, height: h })
      initPoints(w, h)
    }
  }

  const renderMesh = () => {
    const points = pointsRef.current
    const { width: W, height: H } = size
    if (!points.length || W === 0) return null

    const cols = 9
    const triangles = []

    for (let i = 0; i < points.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      // Right neighbor
      if (col < cols - 1) {
        const j = i + 1
        triangles.push(drawEdge(points[i], points[j], i))

        // Triangle down-right
        if (row < 5) {
          const k = i + cols
          triangles.push(drawTriangle(points[i], points[j], points[k], i))
          if (col < cols - 1 && k + 1 < points.length) {
            triangles.push(drawTriangle(points[j], points[k], points[k + 1], i + 1000))
          }
        }
      }

      // Down neighbor
      if (row < 5) {
        triangles.push(drawEdge(points[i], points[i + cols], i + 2000))
      }
    }

    return (
      <Svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {triangles}
      </Svg>
    )
  }

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {renderMesh()}
    </View>
  )
}
