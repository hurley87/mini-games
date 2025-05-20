'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BubbleProps {
  x: number;
  y: number;
  size: number;
  color: string;
}

function Bubble({ x, y, size, color }: BubbleProps) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.7, 0.3, 0.7],
        scale: [1, 1.2, 1],
        x: x + Math.random() * 100 - 50,
        y: y + Math.random() * 100 - 50,
      }}
      transition={{
        duration: 5 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: 'reverse',
      }}
    />
  );
}

export function FloatingBubbles() {
  const [bubbles, setBubbles] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string }>
  >([]);

  useEffect(() => {
    const newBubbles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 20 + 5,
      color: `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.3)`,
    }));
    setBubbles(newBubbles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <title>Floating Bubbles</title>
        {bubbles.map((bubble) => (
          <Bubble key={bubble.id} {...bubble} />
        ))}
      </svg>
    </div>
  );
}
