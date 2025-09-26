import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    {
      title: "Secure Conversations",
      subtitle: "End-to-end encryption keeps your messages safe.",
    },
    {
      title: "Stay Connected",
      subtitle: "Chat seamlessly across all your devices.",
    },
    {
      title: "Understand the Mood",
      subtitle: "Sentiment insights enhance every interaction.",
    },
  ],
  signup: [
    {
      title: "Join Secure Chat",
      subtitle: "Create your account in seconds and start talking.",
    },
    {
      title: "Build Connections",
      subtitle: "Find friends and share memorable moments.",
    },
    {
      title: "Intelligent Insights",
      subtitle: "Sentiment analysis makes conversations smarter.",
    },
  ],
};

export default function AuthMediaCarousel({
  variant = "login",
  interval = 5000,
}) {
  const slides = useMemo(
    () => [
      { src: "/media/secure-chat.jpg", alt: "Secure chat illustration" },
      {
        src: "/media/chat-with-friends.gif",
        alt: "Chat with friends animation",
      },
      { src: "/media/sentiment-chat.jpg", alt: "Sentiment chat illustration" },
    ],
    []
  );

  const captions = CAPTIONS[variant];
  const [index, setIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval, slides.length, isAutoPlaying]);

  // Manual navigation functions
  const goToSlide = (slideIndex) => {
    setIndex(slideIndex);
    setIsAutoPlaying(false);
    // Resume autoplay after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setIndex((i) => (i + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex items-end p-8 group">
      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {slides.map((s, i) => (
        <div
          key={s.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          data-current-src={s.src}
        >
          <img
            src={s.src}
            alt={s.alt}
            className="w-full h-full object-cover object-center select-none"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ))}

      <div className="relative z-10">
        <h2 className="text-lg font-medium leading-snug drop-shadow-md">
          {captions[index].title}
        </h2>
        <p className="mt-2 text-sm text-white/80 max-w-xs drop-shadow">
          {captions[index].subtitle}
        </p>

        {/* Interactive slide indicators */}
        <div className="flex gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-[3px] rounded-full transition-all hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                i === index ? "bg-white w-10" : "bg-white/30 w-10"
              }`}
              aria-label={`Go to slide ${i + 1}`}
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
