import { useId } from "react";
import { cn } from "@/lib/utils";

interface ZorbiProps {
  /** Render width/height in px. Defaults to 96. */
  size?: number;
  /** Show the floating glow + platform underneath. Default true. */
  withPlatform?: boolean;
  /** Apply the gentle floating animation. Default true. */
  floating?: boolean;
  /** Extra classes for the wrapper element. */
  className?: string;
  /** Whether this is a small avatar-style render (no platform, tighter glow). */
  compact?: boolean;
}

/**
 * Zorbi — the Zorbi AI spherical mascot.
 * Glossy white orb, large expressive eyes, tiny blue glow details,
 * floating above a futuristic circular platform.
 */
export function Zorbi({
  size = 96,
  withPlatform = true,
  floating = true,
  className,
  compact = false,
}: ZorbiProps) {
  const uid = useId().replace(/[:]/g, "");
  const g = (name: string) => `${uid}-${name}`;

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute inset-0",
          floating && "animate-zorbi-float",
          compact && floating && "animate-zorbi-float-soft",
        )}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 240 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full"
        >
          <defs>
            {/* Body — glossy white sphere with a cool blue tint */}
            <radialGradient
              id={g("body")}
              cx="35%"
              cy="28%"
              r="80%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#F7FAFF" />
              <stop offset="78%" stopColor="#E8EEFC" />
              <stop offset="100%" stopColor="#D9E4F8" />
            </radialGradient>

            {/* Rim light — soft blue glow along the bottom edge */}
            <radialGradient
              id={g("rim")}
              cx="50%"
              cy="100%"
              r="70%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="55%" stopColor="#B7C8FF" stopOpacity="0" />
              <stop offset="82%" stopColor="#9FB8FF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#7C9CFF" stopOpacity="0.9" />
            </radialGradient>

            {/* Eyes */}
            <radialGradient
              id={g("eye")}
              cx="38%"
              cy="30%"
              r="85%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor="#33406B" />
              <stop offset="60%" stopColor="#101B3A" />
              <stop offset="100%" stopColor="#060D24" />
            </radialGradient>

            {/* Forehead sensor glow */}
            <radialGradient
              id={g("sensor")}
              cx="50%"
              cy="50%"
              r="50%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor="#B9CCFF" />
              <stop offset="55%" stopColor="#7E9DFF" />
              <stop offset="100%" stopColor="#4C6FFF" stopOpacity="0" />
            </radialGradient>

            {/* Under-glow */}
            <radialGradient
              id={g("glow")}
              cx="50%"
              cy="50%"
              r="50%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor="#AFC0FF" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#B9AFFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#C7B8FF" stopOpacity="0" />
            </radialGradient>

            {/* Platform */}
            <linearGradient id={g("plat")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E4EBFB" />
            </linearGradient>
            <linearGradient
              id={g("platRing")}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#AFC4FF" />
              <stop offset="55%" stopColor="#C9B8FF" />
              <stop offset="100%" stopColor="#8FB9FF" />
            </linearGradient>

            {/* Ear nubs */}
            <linearGradient id={g("nub")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#D8E3F8" />
            </linearGradient>
          </defs>

          {/* Under-glow */}
          <ellipse
            cx="120"
            cy="238"
            rx={compact ? 62 : 86}
            ry={compact ? 12 : 17}
            fill={`url(#${g("glow")})`}
            className="animate-glow-pulse"
            style={{ transformOrigin: "120px 238px" }}
          />

          {withPlatform && (
            <g>
              {/* Platform ring */}
              <ellipse
                cx="120"
                cy="228"
                rx="74"
                ry="19"
                fill={`url(#${g("plat")})`}
                stroke={`url(#${g("platRing")})`}
                strokeWidth="2"
                opacity="0.95"
              />
              {/* Inner disc */}
              <ellipse
                cx="120"
                cy="228"
                rx="56"
                ry="13.5"
                fill="#EEF3FF"
                stroke="#D6E1FA"
                strokeWidth="1"
                opacity="0.9"
              />
              {/* Futuristic light dots on the ring */}
              <circle cx="60" cy="227" r="2" fill="#7C9CFF" opacity="0.9" />
              <circle cx="120" cy="247.5" r="2" fill="#A48FFF" opacity="0.9" />
              <circle cx="180" cy="227" r="2" fill="#7C9CFF" opacity="0.9" />
              <circle cx="88" cy="213.5" r="1.6" fill="#AFC0FF" opacity="0.8" />
              <circle cx="152" cy="213.5" r="1.6" fill="#B9AFFF" opacity="0.8" />
            </g>
          )}

          {/* Body */}
          <g>
            {/* Subtle ear nubs */}
            <ellipse
              cx="46"
              cy="92"
              rx="11"
              ry="15"
              fill={`url(#${g("nub")})`}
              stroke="#D3DFF6"
              strokeWidth="1.2"
            />
            <ellipse
              cx="194"
              cy="92"
              rx="11"
              ry="15"
              fill={`url(#${g("nub")})`}
              stroke="#D3DFF6"
              strokeWidth="1.2"
            />
            <circle cx="46" cy="95" r="3" fill="#AFC0FF" opacity="0.75" />
            <circle cx="194" cy="95" r="3" fill="#B9AFFF" opacity="0.75" />

            {/* Main sphere */}
            <circle cx="120" cy="118" r="76" fill={`url(#${g("body")})`} />
            {/* Bottom rim light */}
            <circle
              cx="120"
              cy="118"
              r="76"
              fill={`url(#${g("rim")})`}
              opacity="0.9"
            />
            {/* Gloss highlight */}
            <ellipse
              cx="88"
              cy="78"
              rx="34"
              ry="20"
              fill="#FFFFFF"
              opacity="0.85"
              transform="rotate(-24 88 78)"
            />
            <ellipse
              cx="68"
              cy="60"
              rx="9"
              ry="6"
              fill="#FFFFFF"
              opacity="0.95"
              transform="rotate(-30 68 60)"
            />
            {/* Soft secondary reflection */}
            <ellipse
              cx="160"
              cy="160"
              rx="26"
              ry="12"
              fill="#FFFFFF"
              opacity="0.35"
              transform="rotate(-18 160 160)"
            />

            {/* Forehead sensor */}
            <circle cx="120" cy="58" r="9" fill={`url(#${g("sensor")})`} />
            <circle cx="120" cy="58" r="3.2" fill="#FFFFFF" opacity="0.95" />

            {/* Eyes */}
            <circle cx="82" cy="106" r="15" fill={`url(#${g("eye")})`} />
            <circle cx="158" cy="106" r="15" fill={`url(#${g("eye")})`} />
            {/* Eye highlights */}
            <circle cx="87.5" cy="100" r="5" fill="#FFFFFF" opacity="0.95" />
            <circle cx="163.5" cy="100" r="5" fill="#FFFFFF" opacity="0.95" />
            <circle cx="78" cy="112" r="2.2" fill="#FFFFFF" opacity="0.55" />
            <circle cx="154" cy="112" r="2.2" fill="#FFFFFF" opacity="0.55" />

            {/* Friendly smile */}
            <path
              d="M98 128 Q120 146 142 128"
              stroke="#101B3A"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cheeks — tiny blue & lavender glow details */}
            <circle cx="58" cy="124" r="7" fill="#8FB2FF" opacity="0.35" />
            <circle cx="182" cy="124" r="7" fill="#C4B5FD" opacity="0.35" />
          </g>
        </svg>
      </div>
    </div>
  );
}
