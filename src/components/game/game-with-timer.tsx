'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { GameRenderer } from './game-renderer';
import { Button } from '@/components/ui/button';
import { Play, Trophy, Clock, LogIn } from 'lucide-react';

interface GameWithTimerProps {
  id: string;
  coin: {
    name: string;
    symbol: string;
    image?: string;
    duration?: number; // Duration in seconds
    max_points?: number; // Maximum points per round
  };
}

type GameState = 'start' | 'playing' | 'ended';

export function GameWithTimer({ id, coin }: GameWithTimerProps) {
  const [gameState, setGameState] = useState<GameState>('start');
  const [timeLeft, setTimeLeft] = useState(coin.duration || 60); // Default 60 seconds
  const [score, setScore] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, login } = usePrivy();

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('ended');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Listen for score updates from the game iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        if (
          event.data.type === 'SCORE_UPDATE' &&
          typeof event.data.score === 'number'
        ) {
          setScore(event.data.score);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(coin.duration || 60);
    setScore(0);
    setRefreshKey((prev) => prev + 1);
  };

  const resetGame = () => {
    setGameState('start');
    setTimeLeft(coin.duration || 60);
    setScore(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveScore = async () => {
    if (!user?.farcaster?.fid) return;

    try {
      // TODO: Implement score saving API
      const response = await fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: id,
          userId: user.farcaster.fid,
          score,
          duration: (coin.duration || 60) - timeLeft,
        }),
      });

      if (response.ok) {
        console.log('Score saved successfully');
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  if (!user?.farcaster?.fid) {
    return (
      <div className="flex items-center justify-center h-[750px] w-[400px] bg-[#30363d] rounded-[30px] border-4 border-white">
        <div className="text-center text-white p-6">
          <p className="text-lg mb-6">Connect your Farcaster account to play</p>
          <Button
            onClick={login}
            className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto"
          >
            <LogIn className="w-5 h-5" />
            Connect Farcaster
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Game Renderer - Always rendered but hidden when overlays are shown */}
      <div className={gameState === 'playing' ? 'block' : 'hidden'}>
        <GameRenderer id={id} refreshKey={refreshKey} />
      </div>

      {/* Placeholder when game is not playing */}
      {gameState !== 'playing' && (
        <div
          className="border-4 border-white rounded-lg shadow-sm shadow-amber-100 p-1 bg-[#30363d]"
          style={{
            width: '400px',
            height: '750px',
            position: 'relative',
            margin: '0 auto',
            borderRadius: '30px',
            overflow: 'hidden',
          }}
        />
      )}

      {/* Timer Overlay - Show when playing */}
      {gameState === 'playing' && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex justify-between items-center bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-4 h-4" />
              <span className="font-mono font-bold">
                {score}
                {coin.max_points ? `/${coin.max_points}` : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Start Screen Overlay */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/95 backdrop-blur-sm z-30 rounded-[30px]">
          <div className="text-center text-white p-8 max-w-sm">
            {coin.image && (
              <img
                src={coin.image}
                alt={coin.name}
                className="w-20 h-20 object-cover rounded-xl mx-auto mb-4"
              />
            )}
            <h2 className="text-2xl font-bold mb-2">{coin.name}</h2>
            <p className="text-[#adadad] mb-6">
              Play for {formatTime(coin.duration || 60)} to earn {coin.symbol}{' '}
              tokens!
            </p>
            <Button
              onClick={startGame}
              className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </div>
        </div>
      )}

      {/* Save Score Screen Overlay */}
      {gameState === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/95 backdrop-blur-sm z-30 rounded-[30px]">
          <div className="text-center text-white p-8 max-w-sm">
            <div className="mb-6">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-[#adadad] mb-4">Your final score:</p>
              <div className="text-4xl font-bold text-white mb-4">
                {score}
                {coin.max_points ? `/${coin.max_points}` : ''}
              </div>
              <p className="text-sm text-[#adadad]">
                You&apos;ve earned {score} {coin.symbol} tokens!
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={saveScore}
                className="w-full bg-white text-black hover:bg-gray-100 py-3 rounded-lg font-semibold"
              >
                Save Score
              </Button>
              <Button
                onClick={resetGame}
                variant="ghost"
                className="w-full text-white hover:bg-white/10 py-3 rounded-lg"
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
