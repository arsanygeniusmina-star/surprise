import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { YouTraitsSection } from '@/components/YouTraitsSection';
import { BirthdayCakeSection } from '@/components/BirthdayCakeSection';
import { CelebrationConfetti, AmbientFloatingBalloons } from '@/components/CelebrationConfetti';
import {
  AmbientFloatingHearts,
  ClickHeartExplosion,
} from '@/components/HeartAnimations';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  playChime,
  toggleAudioMute,
  getAudioMuted,
} from '@/lib/sound';

const queryClient = new QueryClient();

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    
    // Immediately show any elements that are already within or just below viewport
    const vh = window.innerHeight || 800;
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.top < vh + 120) {
        node.classList.add('is-visible');
      }
    });

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.01, rootMargin: '140px 0px 40px 0px' }
    );
    nodes.forEach((node) => {
      if (!node.classList.contains('is-visible')) {
        observer.observe(node);
      }
    });
    return () => observer.disconnect();
  }, []);
}

function useScrollMotion() {
  // Disabled to eliminate document-wide style invalidation on scroll for buttery smooth 60fps
}

function Intro({ onEnter }: { onEnter: () => void }) {
  const [gone, setGone] = useState(false);

  const requestFullscreenMode = () => {
    try {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGone(true);
      onEnter();
    }, 3800);
    return () => window.clearTimeout(timer);
  }, [onEnter]);

  const handleStepInside = () => {
    playChime(1);
    requestFullscreenMode();
    setGone(true);
    onEnter();
  };

  return (
    <div
      className={`intro-screen ${gone ? 'is-gone' : ''}`}
      aria-hidden={gone}
      onClick={handleStepInside}
    >
      <div className="intro-orb" />
      <div className="intro-copy">
        <div className="eyebrow intro-note">A birthday world, for one person</div>
        <div className="serif flex items-center justify-center gap-2">
          <span>LOUSANDA</span>
          <span className="text-3xl text-[#FF4B7E] animate-[heart-pulse-glow_1.4s_infinite]" aria-hidden="true">♥</span>
        </div>
        <button
          className="intro-action flex items-center gap-2 mx-auto cursor-pointer"
          data-testid="button-enter-experience"
          onClick={(e) => {
            e.stopPropagation();
            handleStepInside();
          }}
        >
          <span>✦ Step inside · Enter Fullscreen</span>
          <span className="text-xs opacity-75">⛶</span>
        </button>
        <p className="text-[11px] font-mono text-[#FFD4B2]/70 mt-3 tracking-widest uppercase">
          Tap anywhere to begin in full screen
        </p>
      </div>
    </div>
  );
}

function ConfettiField() {
  const pieces = Array.from({ length: 42 }, (_, index) => ({
    index,
    left: `${(index * 27) % 102 - 1}%`,
    delay: `${(index % 10) * 0.18}s`,
    duration: `${4.5 + (index % 5) * 0.6}s`,
    size: `${0.32 + (index % 4) * 0.12}rem`,
    hue: index % 5,
  }));

  return (
    <div className="confetti-field" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          className={`confetti-piece hue-${piece.hue}`}
          key={piece.index}
          style={{
            left: piece.left,
            width: piece.size,
            height: `${Number.parseFloat(piece.size) * (piece.index % 2 ? 1.9 : 0.75)}rem`,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  );
}

function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  const [wished, setWished] = useState(false);
  const [secret, setSecret] = useState(false);
  const [isMuted, setIsMuted] = useState(getAudioMuted());
  const [confettiTrigger, setConfettiTrigger] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useReveal();
  useScrollMotion();

  // Fullscreen tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
      }
    } catch {
      // Fallback
    }
  };

  // Trigger confetti burst on initial mount
  useEffect(() => {
    setConfettiTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ticking = false;
    const line = document.querySelector<HTMLElement>('.progress-line');
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      if (line) line.style.transform = `scaleX(${progress})`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleToggleSound = () => {
    const muted = toggleAudioMute();
    setIsMuted(muted);
    if (!muted) {
      playChime(1);
    }
  };

  const handleSecretToggle = () => {
    playChime(3);
    setSecret((value) => !value);
    if (!secret) {
      setConfettiTrigger((c) => c + 1);
    }
  };

  const handleIntroEnter = () => {
    setIntroVisible(false);
    setConfettiTrigger((c) => c + 1);
  };

  return (
    <div className="birthday-shell grain">
      {/* Ambient Romantic Floating Hearts & Interactive Tap Burst System */}
      <AmbientFloatingHearts />
      <ClickHeartExplosion />

      {/* Full Celebration Confetti & Ambient Floating Balloons */}
      <CelebrationConfetti trigger={confettiTrigger} />
      <AmbientFloatingBalloons />

      {introVisible && <Intro onEnter={handleIntroEnter} />}
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-line" />
      </div>

      {/* Floating Glass Capsule Header */}
      <header className="top-mark" role="banner">
        <div className="top-mark-brand">
          <span className="top-mark-symbol" aria-hidden="true">
            M
          </span>
          <span className="top-mark-name">
            <span className="sm:hidden">LOUSANDA ♥</span>
            <span className="hidden sm:inline">For LOUSANDA · From Carlos</span>
          </span>
        </div>

        <div className="top-mark-center">
          <span className="top-mark-dot" />
          <span>A Birthday Celebration</span>
        </div>

        <div className="top-mark-controls">
          <button
            type="button"
            className="fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            data-testid="button-fullscreen-toggle"
          >
            <span>{isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}</span>
          </button>

          <button
            type="button"
            className={`sound-toggle-btn ${isMuted ? 'is-muted' : ''}`}
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Unmute celestial sound & music' : 'Mute sound & music'}
            data-testid="button-sound-toggle"
          >
            <div className="sound-bars" aria-hidden="true">
              <span className="sound-bar" />
              <span className="sound-bar" />
              <span className="sound-bar" />
            </div>
            <span>{isMuted ? 'Off' : 'On'}</span>
          </button>
        </div>
      </header>

      <main>
        {/* HERO SCENE */}
        <section className="hero" id="begin" aria-labelledby="hero-heading">
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <div className="hero-side-note mono" aria-hidden="true">
            A letter in light
            <br />
            and little moments
          </div>
          <div className="hero-copy">
            <div className="hero-badge reveal">
              <span className="text-xs text-[#FF4B7E] animate-[heartbeat_1.4s_infinite]">♥</span>
              <span className="hero-kicker">A birthday letter for LOUSANDA</span>
            </div>
            <h1 className="display reveal" id="hero-heading">
              Happy
              <br />
              <span>Birthday</span>
              <span className="inline-block text-[#FF4B7E] text-[0.65em] align-middle ml-2 animate-[heart-pulse-glow_1.6s_infinite]" aria-hidden="true">♥</span>
            </h1>
            <p className="hero-sub reveal">
              LOUSANDA, today the whole day gets to be about you. Keep going — there is a little world
              waiting further down.
            </p>
          </div>
          <div className="scroll-cue">
            <i /> Keep going
          </div>
        </section>

        {/* 01 / THE REASON FOR ALL THIS */}
        <section className="about" aria-labelledby="about-heading">
          <div className="about-inner">
            <div className="eyebrow section-number reveal">01 / The reason for all this</div>
            <h2 className="display reveal" id="about-heading">
              Today is
              <br />
              <em>about you.</em>
            </h2>
            <p className="reveal">
              A little corner of the internet, made for one very particular person — the one who
              makes ordinary days feel like they have better lighting.
            </p>
          </div>
        </section>

        {/* 02 / A LITTLE SOMETHING FOR YOU */}
        <section className="letter-scene" aria-labelledby="letter-heading">
          <div className="letter-wrap">
            <div className="letter-heading reveal">
              <div>
                <div className="eyebrow section-number">02 / Read slowly</div>
                <h2 className="display" id="letter-heading">
                  A little
                  <br />
                  <em>something</em>
                  <br />
                  for you.
                </h2>
              </div>
              <p>For the parts of you that deserve to be celebrated out loud.</p>
            </div>
            <article className="letter-paper reveal" data-testid="text-birthday-letter">
              <p>LOUSANDA,</p>
              <p>
                There are people who bring their own weather with them. You bring warmth. The kind
                that makes a room kinder and a hard day feel possible.
              </p>
              <p>
                I hope you know how much of a difference your way of seeing things makes. I hope
                this next chapter gives back some of the joy you hand out so naturally.
              </p>
              <p>
                For today, let yourself be looked after. Let the good things find you easily. You
                have earned a year that feels like a yes.
              </p>
              <p className="letter-sign">
                With all my love and devotion,
                <br />
                <span className="font-serif italic text-2xl text-[#FF4B7E] inline-flex items-center gap-2 mt-1.5">
                  Carlos
                  <span className="text-xl text-[#FF4B7E] animate-[heart-pulse-glow_1.4s_infinite]" aria-hidden="true">♥</span>
                </span>
              </p>
            </article>
          </div>
        </section>

        {/* 03 / YOU : BEAUTIFUL · KIND · LOVELY · INTELLIGENT · CARING · RADIANT */}
        <YouTraitsSection onSendLove={() => setConfettiTrigger((c) => c + 1)} />

        {/* TRANSITION BRIDGE */}
        <section className="bridge-scene" aria-label="A transition">
          <div className="bridge-line reveal">But birthdays are not only about looking back…</div>
          <div className="bridge-line bridge-second reveal">
            They are about making another memory.
          </div>
        </section>

        {/* 04 / MAKE A WISH - LUXURY BIRTHDAY CAKE WITH LIGHTER & MELODIES */}
        <BirthdayCakeSection
          wished={wished}
          onWish={() => setWished(true)}
          onRelight={() => setWished(false)}
          triggerGlobalConfetti={() => setConfettiTrigger((c) => c + 1)}
        />

        {/* 05 / CELEBRATE YOUR YEAR */}
        <section className="celebrate" aria-labelledby="celebrate-heading">
          <ConfettiField />
          <span className="spark" />
          <span className="spark" />
          <span className="spark" />
          <span className="spark" />
          <div className="eyebrow reveal">05 / A toast to what comes next</div>
          <h2 className="display reveal" id="celebrate-heading">
            Celebrate
            <br />
            <em>your year.</em>
          </h2>
          <p className="reveal">
            More late-night laughter. More doors opening. More tiny, perfect moments you did not plan
            for. This whole little celebration is yours.
          </p>
        </section>

        {/* 06 / THE LAST PAGE */}
        <section className="final-scene" aria-labelledby="final-heading">
          <div className="eyebrow reveal">08 / The last page</div>
          <h2 className="display reveal" id="final-heading">
            Happy
            <br />
            <em>Birthday,</em>
            <br />
            LOUSANDA.
          </h2>
          <p className="reveal">
            May this year bring you countless beautiful moments, reasons to smile for no particular
            reason, and memories you will always want to keep.
          </p>

          {/* Prominent, unmistakably clickable surprise button */}
          <div className="mt-14 mb-4 flex justify-center">
            <button
              className="last-thing"
              type="button"
              data-testid="button-last-surprise"
              aria-expanded={secret}
              onClick={handleSecretToggle}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {secret ? '💖' : '🎁'}
              </span>
              <span>
                {secret
                  ? 'Keep this part forever ♥'
                  : 'There might be one more thing… ✦ Tap to reveal'}
              </span>
              <span className="text-xs opacity-80" aria-hidden="true">
                ✦
              </span>
            </button>
          </div>

          <div className={`secret ${secret ? 'revealed' : ''}`} aria-hidden={!secret}>
            <div className="secret-rule" />
            <h3>
              You are
              <br />
              <em>the good part.</em>
              <span className="inline-block text-[#FF4B7E] text-[0.7em] ml-3 animate-[heart-pulse-glow_1.2s_infinite]" aria-hidden="true">
                ♥
              </span>
            </h3>
            <p>That is the secret. That has always been the secret.</p>
            <div className="secret-rule" />
            <div className="eyebrow flex items-center justify-center gap-2">
              <span>Happy birthday, LOUSANDA</span>
              <span className="text-[#FF4B7E] animate-[heartbeat_1.4s_infinite]" aria-hidden="true">♥</span>
              <span>Always by your side, Carlos</span>
            </div>
          </div>
          <div className="footer-note flex items-center justify-center gap-1.5">
            <span>Made with all my heart</span>
            <span className="text-[#FF4B7E] animate-[heart-pulse-glow_1.4s_infinite]" aria-hidden="true">♥</span>
            <span>Carlos for LOUSANDA · Happy Birthday</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
