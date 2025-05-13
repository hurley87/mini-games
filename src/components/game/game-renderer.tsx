'use client';

import { useEffect, useRef } from 'react';

interface GameRendererProps {
  reactCode: string;
}

export function GameRenderer({ reactCode }: GameRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !reactCode) return;

    const blob = new Blob([
      `
      <html>
        <head>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel" data-presets="env,react">
            (() => {
              ${reactCode}
              const root = document.getElementById('root');
              ReactDOM.createRoot(root).render(React.createElement(Game));
            })();
          </script>
        </body>
      </html>
      `
    ], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [reactCode]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      className="w-full min-h-[800px] border rounded"
    />
  );
}