import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  tag: string;
  title: string;
  body: React.ReactNode;
  icon: React.ReactNode;
  extra?: React.ReactNode;
}

interface OnboardingProps {
  onComplete: () => void;
}

// ─── localStorage key ─────────────────────────────────────────────────────────

const ONBOARDING_KEY = "neurolearn_onboarding_complete";

// ─── Hook: use this in App.tsx to gate the onboarding ─────────────────────────

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconWelcome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="9" r="0.5" fill="currentColor" />
    <circle cx="15" cy="9" r="0.5" fill="currentColor" />
  </svg>
);

const IconPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconToken = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.5 8h4a2 2 0 0 1 0 4h-4v4" />
    <path d="M9.5 8V7M9.5 16v1" />
  </svg>
);

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const BpmPill = () => (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(32, 210, 155, 0.08)",
    border: "1px solid rgba(32, 210, 155, 0.2)",
    borderRadius: "20px",
    padding: "6px 14px",
    marginTop: "18px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    color: "#20d29b",
  }}>
    <span style={{
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: "#20d29b",
      animation: "nlPulseDot 1.2s ease-in-out infinite",
      display: "inline-block",
    }} />
    72 BPM · Focus: 91%
  </div>
);

const TierGrid = () => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "20px",
    width: "100%",
    maxWidth: "300px",
  }}>
    {[
      {
        name: "Free",
        desc: "Start your Web3 journey",
        highlight: false,
      },
      {
        name: "Scholar",
        desc: "Build real blockchain literacy",
        highlight: false,
      },
      {
        name: "Expert",
        desc: "Go deep into DeFi and beyond",
        highlight: false,
      },
      {
        name: "Pro ✦",
        desc: "Full access. Full focus. Full leaderboard.",
        highlight: true,
      },
    ].map((tier) => (
      <div key={tier.name} style={{
        background: "rgba(32, 210, 155, 0.04)",
        border: `1px solid ${tier.highlight
          ? "rgba(32, 210, 155, 0.35)"
          : "rgba(32, 210, 155, 0.12)"}`,
        borderRadius: "10px",
        padding: "10px 12px",
        textAlign: "left",
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          color: tier.highlight ? "#26e8ac" : "#20d29b",
          marginBottom: "4px",
        }}>
          {tier.name}
        </div>
        <div style={{
          fontSize: "10px",
          color: "#4a8070",
          lineHeight: 1.5,
        }}>
          {tier.desc}
        </div>
      </div>
    ))}
  </div>
);

const CameraPrivacyBox = () => (
  <div style={{
    marginTop: "20px",
    background: "rgba(32, 210, 155, 0.04)",
    border: "1px dashed rgba(32, 210, 155, 0.25)",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    textAlign: "left",
    maxWidth: "300px",
  }}>
    <span style={{
      color: "#20d29b",
      flexShrink: 0,
      marginTop: "2px",
      width: "18px",
      height: "18px",
      display: "block",
    }}>
      <IconShield />
    </span>
    <p style={{ fontSize: "12px", lineHeight: 1.65, color: "#6a9e8c" }}>
      <strong style={{ color: "#20d29b", fontWeight: 500 }}>
        Your privacy is protected.
      </strong>{" "}
      No video is recorded or stored. Heart rate signals are processed locally
      on your device and never leave your browser.
    </p>
  </div>
);

// ─── Slide definitions ────────────────────────────────────────────────────────

const buildSlides = (): Slide[] => [
  {
    tag: "Welcome",
    icon: <IconWelcome />,
    title: "Welcome to NeuroLearn",
    body: (
      <>
        The world&rsquo;s first{" "}
        <strong style={{ color: "#20d29b", fontWeight: 500 }}>
          biosignal-powered
        </strong>{" "}
        Web3 learning app &mdash; built on Elata Biosciences. Your heart rate
        isn&rsquo;t just data. It&rsquo;s your focus score.
      </>
    ),
  },
  {
    tag: "How It Works",
    icon: <IconPulse />,
    title: "Learn. Track. Score.",
    body: (
      <>
        4 modules across Blockchain, Wallets, DeFi, and NFTs. Each lesson has{" "}
        <strong style={{ color: "#20d29b", fontWeight: 500 }}>
          flashcards
        </strong>
        , a{" "}
        <strong style={{ color: "#20d29b", fontWeight: 500 }}>
          timed quiz
        </strong>
        , and a live{" "}
        <strong style={{ color: "#20d29b", fontWeight: 500 }}>
          Focus Score
        </strong>{" "}
        driven by your biosignals.
      </>
    ),
    extra: <BpmPill />,
  },
  {
    tag: "ELTA Token",
    icon: <IconToken />,
    title: "Every token spent is a level gained.",
    body: (
      <>
        <strong style={{ color: "#20d29b", fontWeight: 500 }}>
          ELTA tokens
        </strong>{" "}
        unlock Scholar, Expert, and Pro tiers &mdash; giving you deeper modules,
        richer tools, and a place on the global leaderboard.
      </>
    ),
    extra: <TierGrid />,
  },
  {
    tag: "Camera Access",
    icon: <IconCamera />,
    title: "Your Camera Powers Your Score",
    body: (
      <>
        NeuroLearn uses{" "}
        <strong style={{ color: "#20d29b", fontWeight: 500 }}>
          rPPG technology
        </strong>{" "}
        to read your heart rate through your webcam &mdash; no wearable needed.
        Your browser will request camera permission next.
      </>
    ),
    extra: <CameraPrivacyBox />,
  },
  {
    tag: "You're Ready",
    icon: <IconCheck />,
    title: "Let's Begin",
    body: (
      <>
        Your first module is unlocked and waiting. Track your focus, beat your
        scores, and grow your Web3 knowledge &mdash; one heartbeat at a time.
      </>
    ),
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const slides = buildSlides();
  const isLast = current === slides.length - 1;

  const goToSlide = (index: number) => {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  };

  const handleNext = () => {
    if (animating) return;
    if (isLast) {
      onComplete();
      return;
    }
    goToSlide(current + 1);
  };

  const handleSkip = () => {
    goToSlide(slides.length - 1);
  };

  const slide = slides[current];

  return (
    <>
      <style>{`
        @keyframes nlPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes nlScan {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes nlFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nl-slide-enter {
          animation: nlFadeIn 0.32s ease forwards;
        }
        .nl-skip-btn:hover {
          border-color: rgba(32, 210, 155, 0.4) !important;
          color: #8ab5a3 !important;
        }
        .nl-next-btn:hover {
          background: #26e8ac !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Full-screen overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 12, 10, 0.93)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}>

        {/* Card */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "#0c1419",
          border: "1px solid rgba(32, 210, 155, 0.18)",
          borderRadius: "24px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: "520px",
        }}>

          {/* Radial glow */}
          <div style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "360px",
            height: "360px",
            background: "radial-gradient(ellipse at center, rgba(32,210,155,0.11) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }} />

          {/* Pulse scan line */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, #20d29b, transparent)",
            animation: "nlScan 3s ease-in-out infinite",
            zIndex: 1,
          }} />

          {/* Slide content */}
          <div
            key={current}
            className="nl-slide-enter"
            style={{
              position: "relative",
              zIndex: 2,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "52px 32px 24px",
              textAlign: "center",
              opacity: animating ? 0 : 1,
              transition: "opacity 0.28s ease",
            }}
          >
            {/* Icon ring */}
            <div style={{
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              border: "1.5px solid rgba(32, 210, 155, 0.28)",
              background: "rgba(32, 210, 155, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "26px",
              color: "#20d29b",
              boxShadow: "0 0 0 8px rgba(32, 210, 155, 0.05)",
            }}>
              <div style={{ width: "34px", height: "34px" }}>
                {slide.icon}
              </div>
            </div>

            {/* Tag */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "#20d29b",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "10px",
              opacity: 0.8,
            }}>
              {slide.tag}
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#f0faf6",
              lineHeight: 1.25,
              marginBottom: "14px",
              margin: "0 0 14px 0",
            }}>
              {slide.title}
            </h2>

            {/* Body */}
            <p style={{
              fontSize: "14px",
              lineHeight: 1.75,
              color: "#8ab5a3",
              maxWidth: "300px",
              margin: 0,
            }}>
              {slide.body}
            </p>

            {/* Extra */}
            {slide.extra && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}>
                {slide.extra}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            position: "relative",
            zIndex: 2,
            padding: "16px 28px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}>

            {/* Progress dots */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
            }}>
              {slides.map((_, i) => (
                <div
                  key={i}
                  onClick={() => goToSlide(i)}
                  style={{
                    width: i === current ? "20px" : "6px",
                    height: "6px",
                    borderRadius: i === current ? "3px" : "50%",
                    background: i === current
                      ? "#20d29b"
                      : "rgba(32, 210, 155, 0.2)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {!isLast && (
                <button
                  className="nl-skip-btn"
                  onClick={handleSkip}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(32, 210, 155, 0.2)",
                    color: "#4a8070",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    padding: "13px 16px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  Skip
                </button>
              )}

              <button
                className="nl-next-btn"
                onClick={handleNext}
                style={{
                  flex: 1,
                  background: "#20d29b",
                  border: "none",
                  color: "#051a12",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  padding: "13px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                {isLast ? "Enter App" : "Next"}
                <div style={{ width: "16px", height: "16px" }}>
                  <IconArrow />
                </div>
              </button>
            </div>

            {/* Step counter */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "rgba(32, 210, 155, 0.35)",
              textAlign: "center",
              letterSpacing: "0.1em",
            }}>
              Step {current + 1} of {slides.length}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
