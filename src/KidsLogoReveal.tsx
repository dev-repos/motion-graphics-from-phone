import React, { useEffect, useState } from "react";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Fredoka, extracted byte-for-byte from the fonts embedded in brand/*.svg.
loadFont({
  family: "Fredoka",
  url: staticFile("fonts/Fredoka-600.woff2"),
  weight: "600",
});
loadFont({
  family: "Fredoka",
  url: staticFile("fonts/Fredoka-700.woff2"),
  weight: "700",
});

// Brand colours (from brand/kids-icon.svg and brand/kids-wordmark.svg).
const INK = "#1B0F5C";
const RING = [
  "#FF5C8A",
  "#FB923C",
  "#FDE047",
  "#4ADE80",
  "#22D3EE",
  "#60A5FA",
  "#C084FC",
];
const RING_ARCS = [
  "M266.3 20.2 A236 236 0 0 1 433.9 100.9",
  "M446.8 117.0 A236 236 0 0 1 488.2 298.4",
  "M483.6 318.5 A236 236 0 0 1 367.6 464.0",
  "M349.0 472.9 A236 236 0 0 1 163.0 472.9",
  "M144.4 464.0 A236 236 0 0 1 28.4 318.5",
  "M23.8 298.4 A236 236 0 0 1 65.2 117.0",
  "M78.1 100.9 A236 236 0 0 1 245.7 20.2",
];
const TITLE: { text: string; fill: string }[] = [
  { text: "K", fill: "#FF5C8A" },
  { text: "i", fill: "#FB923C" },
  { text: "d", fill: "#4ADE80" },
  { text: "s", fill: "#22D3EE" },
  ...".Join".split("").map((text) => ({ text, fill: "#FFFFFF" })),
  ...["D", "e", "v"].map((text) => ({ text, fill: "#C3EF1D" })),
];
const TITLE_FONT = "700 150px Fredoka";

// Timeline, in seconds. One idea at a time, each overlapping the last only as it settles.
const T = {
  disc: 0.05,
  ring: 0.2,
  face: 1.2,
  smile: 1.75,
  brackets: 2.2,
  slide: 2.85,
  letters: 3.3,
  url: 4.3,
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);

// Measures kerned x offsets of each title letter so letters can move independently
// while landing exactly where the wordmark's single <text> would put them.
const useTitleOffsets = () => {
  const [handle] = useState(() => delayRender("Measuring wordmark"));
  const [offsets, setOffsets] = useState<number[] | null>(null);
  useEffect(() => {
    document.fonts.load(TITLE_FONT).then(() => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.font = TITLE_FONT;
      const full = TITLE.map((l) => l.text).join("");
      const xs = [...full].map((_, i) => ctx.measureText(full.slice(0, i)).width);
      xs.push(ctx.measureText(full).width);
      setOffsets(xs);
      continueRender(handle);
    });
  }, [handle]);
  return offsets;
};

export const KidsLogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const offsets = useTitleOffsets();
  const at = (s: number) => s * fps;
  const spr = (start: number, config: Parameters<typeof spring>[0]["config"]) =>
    spring({ frame: frame - at(start), fps, config });

  // --- Layout: everything lives in the wordmark's own 1400x360 coordinate space.
  const titleWidth = offsets ? offsets[offsets.length - 1] : 900;
  const S = 1.2;
  const contentLeft = 20;
  const contentRight = 380 + titleWidth + 9;
  const ox = width / 2 - (S * (contentLeft + contentRight)) / 2;
  const oy = height / 2 - S * 170;

  // Badge: centred and large first, then slides into its wordmark slot (20,20 @ 0.625).
  const slide = spr(T.slide, { damping: 200, stiffness: 170, mass: 1 });
  const bigScale = 600 / 512 / S;
  const bigX = (width / 2 - ox) / S - 256 * bigScale;
  const bigY = (height / 2 - oy) / S - 256 * bigScale;
  const badgeX = interpolate(slide, [0, 1], [bigX, 20]);
  const badgeY = interpolate(slide, [0, 1], [bigY, 20]);
  const badgeScale = interpolate(slide, [0, 1], [bigScale, 0.625]);

  // Shot 1: disc settles in and the rainbow ring draws on, segment by segment.
  const disc = interpolate(frame, [at(T.disc), at(T.disc + 0.5)], [0, 1], {
    ...clamp,
    easing: easeOutExpo,
  });
  const arc = (i: number) =>
    interpolate(
      frame,
      [at(T.ring + i * 0.1), at(T.ring + i * 0.1 + 0.42)],
      [0, 1],
      { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) },
    );
  const pop = (start: number) =>
    spr(start, { damping: 10, stiffness: 220, mass: 0.6 });

  // Shot 2: Bit pops in, then smiles.
  const head = spr(T.face, { damping: 15, stiffness: 160, mass: 0.8 });
  const antenna = spr(T.face + 0.15, { damping: 8, stiffness: 200, mass: 0.6 });
  const smile = spr(T.smile, { damping: 11, stiffness: 140, mass: 0.7 });
  const mouthDepth = interpolate(smile, [0, 1], [0.18, 1]);
  const eyeLift = interpolate(smile, [0, 1], [-1, -16]);
  const blush = interpolate(smile, [0, 0.6], [0, 0.7], clamp);

  // Shot 3: brackets snap in from either side.
  const snapCfg = { damping: 14, stiffness: 260, mass: 0.7 };
  const leftB = spr(T.brackets, snapCfg);
  const rightB = spr(T.brackets + 0.1, snapCfg);

  // Shot 4: letters land one by one, then the URL settles underneath.
  const letter = (i: number) =>
    spr(T.letters + i * 0.06, { damping: 12, stiffness: 170, mass: 0.7 });
  const url = interpolate(frame, [at(T.url), at(T.url + 0.6)], [0, 1], {
    ...clamp,
    easing: easeOutExpo,
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 75% 85% at 50% 42%, #4C2BD0 0%, #3A1C9C 48%, #1B0F5C 100%)",
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="night" cx="50%" cy="38%" r="70%">
            <stop offset="0" stopColor="#6A48F0" />
            <stop offset="0.55" stopColor="#4C2BD0" />
            <stop offset="1" stopColor="#3A1C9C" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${ox} ${oy}) scale(${S})`}>
          {/* ---------- Badge (512x512 space) ---------- */}
          <g
            transform={`translate(${badgeX} ${badgeY}) scale(${badgeScale})`}
          >
            <circle
              cx="256"
              cy="256"
              r="256"
              fill="url(#night)"
              opacity={disc}
              transform={`translate(256 256) scale(${interpolate(disc, [0, 1], [0.86, 1])}) translate(-256 -256)`}
            />

            {/* Sparkles twinkle in as the ring passes them */}
            <Sparkle p={pop(T.ring + 0.15)} cx={120} cy={118}>
              <path d="M120 105 Q120 118 133 118 Q120 118 120 131 Q120 118 107 118 Q120 118 120 105Z" fill="#FFFFFF" opacity="0.9" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.3)} cx={398} cy={112}>
              <path d="M398 103 Q398 112 407 112 Q398 112 398 121 Q398 112 389 112 Q398 112 398 103Z" fill="#FDE047" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.6)} cx={92} cy={300}>
              <path d="M92 293 Q92 300 99 300 Q92 300 92 307 Q92 300 85 300 Q92 300 92 293Z" fill="#FFFFFF" opacity="0.7" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.45)} cx={424} cy={318}>
              <path d="M424 310 Q424 318 432 318 Q424 318 424 326 Q424 318 416 318 Q424 318 424 310Z" fill="#FFFFFF" opacity="0.7" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.2)} cx={170} cy={70}>
              <circle cx="170" cy="70" r="3.5" fill="#FFFFFF" opacity="0.8" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.25)} cx={350} cy={64}>
              <circle cx="350" cy="64" r="3" fill="#FFFFFF" opacity="0.7" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.4)} cx={448} cy={220}>
              <circle cx="448" cy="220" r="3" fill="#FFFFFF" opacity="0.7" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.65)} cx={62} cy={214}>
              <circle cx="62" cy="214" r="3" fill="#FFFFFF" opacity="0.7" />
            </Sparkle>

            {/* Rainbow ring */}
            {RING_ARCS.map((d, i) => {
              const p = arc(i);
              return (
                <path
                  key={d}
                  d={d}
                  pathLength={1}
                  stroke={RING[i]}
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - p}
                  opacity={p > 0.001 ? 1 : 0}
                />
              );
            })}
            <Sparkle p={pop(T.ring + 0.18)} cx={422.9} cy={89.1}>
              <circle cx="422.9" cy="89.1" r="13.3" fill={INK} stroke="#FFFFFF" strokeWidth="7" />
            </Sparkle>
            <Sparkle p={pop(T.ring + 0.62)} cx={89.1} cy={422.9}>
              <circle cx="89.1" cy="422.9" r="13.3" fill={INK} stroke="#FFFFFF" strokeWidth="7" />
            </Sparkle>

            {/* < > brackets */}
            <path
              d="M110 194.8 L62 242.8 L110 290.8"
              stroke="#C3EF1D"
              strokeWidth="19"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              opacity={interpolate(leftB, [0, 0.25], [0, 1], clamp)}
              transform={`translate(${interpolate(leftB, [0, 1], [-340, 0])} 0)`}
            />
            <path
              d="M402 194.8 L450 242.8 L402 290.8"
              stroke="#22D3EE"
              strokeWidth="19"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              opacity={interpolate(rightB, [0, 0.25], [0, 1], clamp)}
              transform={`translate(${interpolate(rightB, [0, 1], [340, 0])} 0)`}
            />

            {/* Bit */}
            <g transform="translate(96 70) scale(1.6)">
              <g
                transform={`translate(100 176) scale(${antenna}) translate(-100 -176)`}
                opacity={antenna > 0.01 ? 1 : 0}
              >
                <line x1="100" y1="40" x2="100" y2="16" stroke="#E9D5FF" strokeWidth="7" strokeLinecap="round" />
                <circle cx="100" cy="12" r="11" fill="#FDE047" filter="url(#glow)" />
              </g>
              <g
                transform={`translate(100 108) scale(${head}) translate(-100 -108)`}
                opacity={head > 0.01 ? 1 : 0}
              >
                <circle cx="24" cy="108" r="12" fill="#F472B6" stroke={INK} strokeWidth="3" />
                <circle cx="176" cy="108" r="12" fill="#F472B6" stroke={INK} strokeWidth="3" />
                <rect x="24" y="40" width="152" height="136" rx="44" fill="#A78BFA" stroke="#F3E8FF" strokeWidth="6" />
                <rect x="42" y="64" width="116" height="96" rx="30" fill="#10214F" />
                <path
                  d={`M63 106 q13 ${eyeLift} 26 0 M111 106 q13 ${eyeLift} 26 0`}
                  stroke="#67E8F9"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d={`M80 130 q20 ${26 * mouthDepth} 40 0 q-20 ${8 * mouthDepth} -40 0Z`}
                  fill="#67E8F9"
                  stroke="#67E8F9"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <ellipse cx="58" cy="132" rx="9" ry="5" fill="#F472B6" opacity={blush} />
                <ellipse cx="142" cy="132" rx="9" ry="5" fill="#F472B6" opacity={blush} />
              </g>
            </g>
          </g>

          {/* ---------- Wordmark text ---------- */}
          {offsets
            ? TITLE.map((l, i) => {
                const p = letter(i);
                const cx = 380 + (offsets[i] + offsets[i + 1]) / 2;
                return (
                  <text
                    key={i}
                    x={380 + offsets[i]}
                    y={205}
                    fontFamily="Fredoka"
                    fontSize={150}
                    fontWeight={700}
                    fill={l.fill}
                    stroke={INK}
                    strokeWidth={18}
                    paintOrder="stroke"
                    strokeLinejoin="round"
                    opacity={interpolate(p, [0, 0.12], [0, 1], clamp)}
                    transform={`translate(0 ${interpolate(p, [0, 1], [-70, 0])}) translate(${cx} 205) scale(${interpolate(p, [0, 1], [0.8, 1])}) translate(${-cx} -205)`}
                  >
                    {l.text}
                  </text>
                );
              })
            : null}
          <text
            x={388}
            y={300}
            fontFamily="Fredoka"
            fontSize={58}
            fontWeight={600}
            fill="#FDE047"
            stroke={INK}
            strokeWidth={10}
            paintOrder="stroke"
            strokeLinejoin="round"
            opacity={url}
            transform={`translate(0 ${interpolate(url, [0, 1], [24, 0])})`}
          >
            kids.join.dev
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Sparkle: React.FC<{
  p: number;
  cx: number;
  cy: number;
  children: React.ReactNode;
}> = ({ p, cx, cy, children }) => (
  <g
    transform={`translate(${cx} ${cy}) scale(${Math.max(0, p)}) translate(${-cx} ${-cy})`}
    opacity={p > 0.01 ? 1 : 0}
  >
    {children}
  </g>
);
