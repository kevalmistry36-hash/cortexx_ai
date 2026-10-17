import React from 'react';

interface CortexxOfficialSealProps {
  className?: string;
  size?: number;
}

export const CortexxOfficialSeal: React.FC<CortexxOfficialSealProps> = ({
  className = 'w-24 h-24',
  size = 100,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <path id="top-arc-seal" d="M 45,200 A 155,155 0 0,1 355,200" fill="none" />
        <path id="bottom-arc-seal" d="M 355,200 A 155,155 0 0,1 45,200" fill="none" />
      </defs>

      {/* Background circle */}
      <circle cx="200" cy="200" r="196" fill="#ffffff" />

      {/* Outer Double Border */}
      <circle cx="200" cy="200" r="192" fill="none" stroke="#0a215c" strokeWidth="7" />
      <circle cx="200" cy="200" r="183" fill="none" stroke="#0a215c" strokeWidth="2.5" />

      {/* Inner Concentric Ring */}
      <circle cx="200" cy="200" r="132" fill="none" stroke="#0a215c" strokeWidth="3.5" />

      {/* Top Curved Text: CORTEXX AI INSTITUTE */}
      <text
        fill="#0a215c"
        fontFamily="'Arial Black', 'Montserrat', Arial, sans-serif"
        fontWeight="900"
        fontSize="25.5"
        letterSpacing="3.8"
      >
        <textPath href="#top-arc-seal" startOffset="50%" textAnchor="middle">
          CORTEXX AI INSTITUTE
        </textPath>
      </text>

      {/* Stars on Sides */}
      <polygon points="56,200 60,208 69,209 62,216 64,225 56,220 48,225 50,216 43,209 52,208" fill="#0a215c" />
      <polygon points="344,200 348,208 357,209 350,216 352,225 344,220 336,225 338,216 331,209 340,208" fill="#0a215c" />

      {/* Bottom Curved Text: WHERE THINKING MEETS TECHNOLOGY */}
      <text
        fill="#0a215c"
        fontFamily="'Arial Black', 'Montserrat', Arial, sans-serif"
        fontWeight="900"
        fontSize="14.8"
        letterSpacing="2.8"
      >
        <textPath href="#bottom-arc-seal" startOffset="50%" textAnchor="middle">
          WHERE THINKING MEETS TECHNOLOGY
        </textPath>
      </text>

      {/* Center Brain Graphic */}
      <g transform="translate(200, 160) scale(1.15)">
        {/* Left Brain Hemisphere (White with Navy Neural Circuits) */}
        <path
          d="M -2,-52 C -20,-52 -45,-38 -45,-12 C -45,2 -35,12 -42,24 C -48,34 -38,50 -20,52 C -10,53 -4,50 -2,48 Z"
          fill="#ffffff"
          stroke="#0a215c"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Left Circuits */}
        <path d="M -8,-40 C -18,-38 -32,-32 -28,-18 C -26,-10 -15,-10 -18,2" fill="none" stroke="#0a215c" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M -6,-24 L -18,-18 L -14,-4" fill="none" stroke="#0a215c" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M -35,-8 L -24,4 L -26,18 L -10,18" fill="none" stroke="#0a215c" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M -30,22 L -20,28 L -18,40" fill="none" stroke="#0a215c" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M -8,10 L -4,32" fill="none" stroke="#0a215c" strokeWidth="2.4" strokeLinecap="round" />

        {/* Left Circuit Node Dots */}
        <circle cx="-28" cy="-18" r="3" fill="#0a215c" />
        <circle cx="-18" cy="2" r="3" fill="#0a215c" />
        <circle cx="-35" cy="-8" r="2.8" fill="#0a215c" />
        <circle cx="-10" cy="18" r="3" fill="#0a215c" />
        <circle cx="-30" cy="22" r="2.8" fill="#0a215c" />
        <circle cx="-18" cy="40" r="3" fill="#0a215c" />
        <circle cx="-42" cy="14" r="2.5" fill="#0a215c" />
        <circle cx="-38" cy="-28" r="2.5" fill="#0a215c" />

        {/* Right Brain Hemisphere (Solid Navy Blue with Tech Circuit Engravings) */}
        <path
          d="M 2,-52 C 20,-52 45,-38 45,-12 C 45,2 35,12 42,24 C 48,34 38,50 20,52 C 10,53 4,50 2,48 Z"
          fill="#0a215c"
          stroke="#0a215c"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Right Circuits (White on Navy) */}
        <path d="M 8,-40 C 18,-38 32,-32 28,-18 C 26,-10 15,-10 18,2" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M 6,-24 L 18,-18 L 14,-4" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 35,-8 L 24,4 L 26,18 L 10,18" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M 30,22 L 20,28 L 18,40" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 8,10 L 4,32" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

        {/* Right Circuit Nodes (White Dots) */}
        <circle cx="28" cy="-18" r="2.8" fill="#ffffff" />
        <circle cx="18" cy="2" r="2.8" fill="#ffffff" />
        <circle cx="35" cy="-8" r="2.5" fill="#ffffff" />
        <circle cx="10" cy="18" r="2.8" fill="#ffffff" />
        <circle cx="30" cy="22" r="2.5" fill="#ffffff" />
        <circle cx="18" cy="40" r="2.8" fill="#ffffff" />

        {/* Central Dividing Line */}
        <line x1="0" y1="-50" x2="0" y2="48" stroke="#0a215c" strokeWidth="3" />
        <polygon points="0,-4 3,0 0,4 -3,0" fill="#0a215c" />
      </g>

      {/* Wordmark Below Brain: Cortexx AI */}
      <text
        x="200"
        y="254"
        textAnchor="middle"
        fontFamily="'Century Gothic', 'Montserrat', Arial, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#0a215c"
        letterSpacing="1"
      >
        Cortexx AI
      </text>

      {/* Divider Line with Center Diamond */}
      <g transform="translate(200, 268)">
        <line x1="-70" y1="0" x2="-10" y2="0" stroke="#0a215c" strokeWidth="2.2" strokeLinecap="round" />
        <polygon points="0,-4 4,0 0,4 -4,0" fill="#0a215c" />
        <line x1="10" y1="0" x2="70" y2="0" stroke="#0a215c" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
};
