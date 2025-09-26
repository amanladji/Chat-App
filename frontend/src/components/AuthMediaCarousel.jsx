import { useEffect, useState, useMemo } from 'react';

/*
AuthMediaCarousel
Displays a simple auto-advancing carousel of auth marketing images (jpg/jpeg + gif) with fade transition.
Assets now standardized (placed in /public/media):
 /public/media/secure-chat.jpg
 /public/media/chat-with-friends.gif
 /public/media/sentiment-chat.jpg

Props:
 - variant: 'login' | 'signup' (affects captions)
 - interval: ms between slides (default 5000)
*/

const CAPTIONS = {
  login: [
    { title: 'Secure Conversations', subtitle: 'End-to-end encryption keeps your messages safe.' },
    { title: 'Stay Connected', subtitle: 'Chat seamlessly across all your devices.' },
    { title: 'Understand the Mood', subtitle: 'Sentiment insights enhance every interaction.' }
  ],
  signup: [
    { title: 'Join Secure Chat', subtitle: 'Create your account in seconds and start talking.' },
    { title: 'Build Connections', subtitle: 'Find friends and share memorable moments.' },
    { title: 'Intelligent Insights', subtitle: 'Sentiment analysis makes conversations smarter.' }
  ]
};

export default function AuthMediaCarousel({ variant = 'login', interval = 5000 }) {
  const slides = useMemo(() => [
    { src: '/media/secure-chat.jpg', alt: 'Secure chat illustration' },
    { src: '/media/chat-with-friends.gif', alt: 'Chat with friends animation' },
    { src: '/media/sentiment-chat.jpg', alt: 'Sentiment chat illustration' }
  ], []);

  const captions = CAPTIONS[variant];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval, slides.length]);

  return (
    <div className="relative w-full h-full overflow-hidden flex items-end p-8">
      {slides.map((s, i) => (
        <div
          key={s.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
          data-current-src={s.src}
        >
          <img
            src={s.src}
            alt={s.alt}
            className="w-full h-full object-cover object-center select-none"
            draggable={false}
            onError={(e)=>{
              e.currentTarget.style.display='none';
            }}
          />
        </div>
      ))}
      <div className="relative z-10">
        <h2 className="text-lg font-medium leading-snug drop-shadow-md">{captions[index].title}</h2>
        <p className="mt-2 text-sm text-white/80 max-w-xs drop-shadow">{captions[index].subtitle}</p>
        <div className="flex gap-2 mt-6">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-[3px] rounded-full transition-all ${i === index ? 'bg-white w-10' : 'bg-white/30 w-10'}`}
            />
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,#6f56e9_0%,#443362_60%,#221c30_100%)] opacity-55 mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1f1a27] via-transparent to-transparent" />
    </div>
  );
}

// (Simplified) Removed multi-fallback logic now that assets standardized
