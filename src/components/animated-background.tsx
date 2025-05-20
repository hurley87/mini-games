'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const GameElement = ({
  delay,
  x,
  y,
  size,
  emoji,
}: {
  delay: number;
  x: number;
  y: number;
  size: number;
  emoji: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: y + 100 }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        y: [y, y - 20, y],
        x: [x, x + 10, x],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute pointer-events-none select-none"
      style={{
        fontSize: `${size}px`,
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      {emoji}
    </motion.div>
  );
};

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const gameElements = [
    { emoji: '🎮', size: 24, x: 10, y: 20, delay: 0 },
    { emoji: '🎲', size: 20, x: 85, y: 30, delay: 0.5 },
    { emoji: '🎯', size: 22, x: 25, y: 60, delay: 1 },
    { emoji: '🎪', size: 26, x: 75, y: 70, delay: 1.5 },
    { emoji: '🎨', size: 20, x: 40, y: 40, delay: 2 },
    { emoji: '🎭', size: 24, x: 60, y: 50, delay: 2.5 },
    { emoji: '🎪', size: 22, x: 15, y: 80, delay: 3 },
    { emoji: '🎲', size: 20, x: 90, y: 60, delay: 3.5 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {gameElements.map((element, index) => (
        <GameElement key={index} {...element} />
      ))}
    </div>
  );
}
