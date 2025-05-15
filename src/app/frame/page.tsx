import { Metadata } from 'next';

const appUrl = 'https://jestr.fun';

const frame = {
  version: 'next',
  imageUrl: `${appUrl}/logo.jpg`,
  button: {
    title: 'Join Jestr',
    action: {
      type: 'launch_frame',
      name: 'Jestr',
      url: `${appUrl}/frame`,
      splashImageUrl: `${appUrl}/logo.jpg`,
      splashBackgroundColor: '#FFFFFF',
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Jestr',
    openGraph: {
      title: 'Jestr',
      description:
        'Track and get notified about the next big Solana token drops',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
}
export default function FrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
