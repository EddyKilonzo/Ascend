"use client";

import { Crown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";

function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  return min + ((((v - min) % range) + range) % range);
}

export interface Participant {
  avatar: string;
}

export interface AppleInviteEvent {
  backgroundClassName?: string;
  badge?: string;
  id: number;
  image?: string;
  location: string;
  participants?: Participant[];
  subtitle?: string;
  title?: string;
}

export interface AppleInvitesProps {
  activeIndex?: number;
  cardHeight?: number;
  cardWidth?: number;
  className?: string;
  events: AppleInviteEvent[];
  interval?: number;
  onChange?: (index: number) => void;
}

export default function AppleInvites({
  events,
  interval = 3500,
  className = "",
  activeIndex: controlledIndex,
  onChange,
  cardWidth = 240,
  cardHeight,
}: AppleInvitesProps) {
  const shouldReduceMotion = useReducedMotion();
  const [internalPage, setInternalPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const resolvedHeight = cardHeight ?? Math.round(cardWidth * 1.5625);

  const page = controlledIndex === undefined ? internalPage : controlledIndex;
  const setPage = (val: number, dir: number) => {
    if (onChange) {
      onChange(val);
    } else {
      setInternalPage(val);
      setDirection(dir);
    }
  };

  const activeIndex = wrap(0, events.length, page);
  const setPageRef = useRef(setPage);
  useEffect(() => { setPageRef.current = setPage; });

  useEffect(() => {
    const timer = setInterval(() => {
      setPageRef.current(page + 1, 1);
    }, interval);
    return () => clearInterval(timer);
  }, [page, interval]);

  const visibleEvents = [-1, 0, 1].map(
    (offset) => events[wrap(0, events.length, activeIndex + offset)]
  );

  const variants = useMemo(
    () => ({
      center: {
        x: "-50%",
        rotate: 0,
        scale: 1,
        opacity: 1,
        zIndex: 3,
        transition: shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring" as const, stiffness: 300, damping: 30, duration: 0.25 },
      },
      left: {
        x: "-130%",
        rotate: -12,
        scale: 0.88,
        opacity: 0.7,
        zIndex: 2,
        transition: shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring" as const, stiffness: 300, damping: 30, duration: 0.25 },
      },
      right: {
        x: "30%",
        rotate: 12,
        scale: 0.88,
        opacity: 0.7,
        zIndex: 2,
        transition: shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring" as const, stiffness: 300, damping: 30, duration: 0.25 },
      },
      hidden: {
        opacity: 0,
        zIndex: 1,
        transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.3 },
      },
    }),
    [shouldReduceMotion]
  );

  const getVariant = (index: number) => {
    if (index === 1) return "center";
    if (index === 0) return "left";
    return "right";
  };

  return (
    <div className={`relative flex h-full w-full items-center justify-center ${className}`}>
      <AnimatePresence custom={direction} initial={false}>
        {visibleEvents.map((event, index) => (
          <motion.div
            key={event.id}
            animate={getVariant(index)}
            className="absolute top-1/2 left-1/2 origin-center -translate-y-1/2"
            custom={direction}
            exit="hidden"
            initial="hidden"
            variants={variants}
            style={{ width: cardWidth, height: resolvedHeight }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-3xl">
              {event.image ? (
                <img
                  alt={event.title || ""}
                  className="h-full w-full object-cover"
                  src={event.image}
                />
              ) : event.backgroundClassName ? (
                <div className={`h-full w-full ${event.backgroundClassName}`} />
              ) : (
                <div className="h-full w-full" style={{ background: 'var(--bg-card)' }} />
              )}

              {/* Badge */}
              {event.badge && (
                <div className="absolute z-10 top-4 left-4">
                  <span className="flex flex-row items-center gap-1.5 rounded-full bg-black/30 font-medium text-white backdrop-blur-xl px-3 py-1 text-xs">
                    <Crown size={12} />
                    {event.badge}
                  </span>
                </div>
              )}

              {/* Frosted glass bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 isolate z-[2] h-1/2 pointer-events-none">
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl" style={{ backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)', maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }} />
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl" style={{ backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', maskImage: 'linear-gradient(to top, black 40%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent)' }} />
                <div className="absolute inset-0 overflow-hidden rounded-b-3xl" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', maskImage: 'linear-gradient(to top, black 60%, transparent)', WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent)' }} />
              </div>

              {/* Content overlay */}
              <div className="absolute bottom-0 z-[3] w-full rounded-b-3xl text-white p-5">
                {event.participants && event.participants.length > 0 && (
                  <div className="flex items-center justify-center mb-2 gap-2">
                    {event.participants.map((p, idx) => (
                      <img
                        key={idx}
                        alt=""
                        className="rounded-full object-cover"
                        src={p.avatar}
                        style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.6)' }}
                      />
                    ))}
                  </div>
                )}
                {event.title && (
                  <p className="text-center font-bold text-base leading-snug mb-1">{event.title}</p>
                )}
                {event.subtitle && (
                  <p className="text-center text-xs opacity-80 leading-snug mb-1">{event.subtitle}</p>
                )}
                <p className="text-center text-[11px] opacity-75 leading-relaxed">{event.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5 pb-1">
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i, i > activeIndex ? 1 : -1)}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === activeIndex ? 16 : 6,
              height: 6,
              background: i === activeIndex ? '#428475' : 'rgba(66,132,117,0.3)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
