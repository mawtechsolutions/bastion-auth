// BastionAuth Logo Components
// Shield with castle turrets and key - Official branding

export interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Full BastionAuth Logo with text
 * Default size: 200x50
 */
export function BastionAuthLogo({ 
  width = 200, 
  height = 50,
  className = '' 
}: LogoProps) {
  const aspectRatio = 400 / 100;
  const calculatedHeight = height || width / aspectRatio;
  const calculatedWidth = width || height * aspectRatio;

  return (
    <svg 
      width={calculatedWidth} 
      height={calculatedHeight} 
      viewBox="0 0 400 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="BastionAuth"
    >
      <defs>
        <linearGradient id="bastionShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B9E8B"/>
          <stop offset="50%" stopColor="#3B8B9E"/>
          <stop offset="100%" stopColor="#1B4A7D"/>
        </linearGradient>
        <linearGradient id="bastionLeftTower" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B4A6D"/>
          <stop offset="100%" stopColor="#1B3A5D"/>
        </linearGradient>
        <linearGradient id="bastionRightTower" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B8B8B"/>
          <stop offset="100%" stopColor="#3B9B9B"/>
        </linearGradient>
      </defs>
      
      {/* Shield Group */}
      <g transform="translate(10, 2)">
        {/* Main Shield Shape */}
        <path 
          d="M50 8 L50 65 Q50 85 25 95 Q0 85 0 65 L0 8 Q25 3 50 8 Z" 
          fill="url(#bastionShieldGradient)"
        />
        
        {/* Left Castle Tower */}
        <path 
          d="M5 12 L5 28 L9 28 L9 22 L13 22 L13 28 L17 28 L17 22 L21 22 L21 28 L25 28 L25 12 L21 12 L21 8 L17 8 L17 12 L13 12 L13 8 L9 8 L9 12 Z" 
          fill="url(#bastionLeftTower)"
        />
        
        {/* Right Castle Tower */}
        <path 
          d="M25 12 L25 28 L29 28 L29 22 L33 22 L33 28 L37 28 L37 22 L41 22 L41 28 L45 28 L45 12 L41 12 L41 8 L37 8 L37 12 L33 12 L33 8 L29 8 L29 12 Z" 
          fill="url(#bastionRightTower)"
        />
        
        {/* Key Head */}
        <circle cx="25" cy="38" r="8" fill="white"/>
        <circle cx="25" cy="38" r="4" fill="url(#bastionShieldGradient)"/>
        
        {/* Key Shaft */}
        <rect x="22" y="46" width="6" height="26" fill="white"/>
        
        {/* Key Teeth */}
        <rect x="28" y="56" width="8" height="4" fill="white"/>
        <rect x="28" y="64" width="6" height="4" fill="white"/>
        
        {/* Bottom Chevron */}
        <path 
          d="M5 68 L25 88 L45 68 L40 68 L25 82 L10 68 Z" 
          fill="#1B4A6D"
        />
      </g>
      
      {/* Text: "Bastion" in navy blue */}
      <text 
        x="80" 
        y="62" 
        fontFamily="'Segoe UI', 'SF Pro Display', system-ui, -apple-system, sans-serif" 
        fontSize="42" 
        fontWeight="700" 
        fill="#1B4A7D"
      >
        Bastion
      </text>
      
      {/* Text: "Auth" in teal */}
      <text 
        x="250" 
        y="62" 
        fontFamily="'Segoe UI', 'SF Pro Display', system-ui, -apple-system, sans-serif" 
        fontSize="42" 
        fontWeight="700" 
        fill="#2B9E8B"
      >
        Auth
      </text>
    </svg>
  );
}

/**
 * BastionAuth Icon only (shield without text)
 * Default size: 40x50
 */
export function BastionAuthIcon({ 
  size = 40,
  className = '' 
}: { 
  size?: number;
  className?: string;
}) {
  const height = size * 1.25;

  return (
    <svg 
      width={size} 
      height={height} 
      viewBox="0 0 80 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="BastionAuth"
    >
      <defs>
        <linearGradient id="iconShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B9E8B"/>
          <stop offset="50%" stopColor="#3B8B9E"/>
          <stop offset="100%" stopColor="#1B4A7D"/>
        </linearGradient>
        <linearGradient id="iconLeftTower" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B4A6D"/>
          <stop offset="100%" stopColor="#1B3A5D"/>
        </linearGradient>
        <linearGradient id="iconRightTower" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B8B8B"/>
          <stop offset="100%" stopColor="#3B9B9B"/>
        </linearGradient>
      </defs>
      
      {/* Main Shield Shape */}
      <path 
        d="M70 8 L70 70 Q70 90 40 100 Q10 90 10 70 L10 8 Q40 0 70 8 Z" 
        fill="url(#iconShieldGradient)"
      />
      
      {/* Left Castle Tower */}
      <path 
        d="M14 14 L14 32 L18 32 L18 24 L22 24 L22 32 L26 32 L26 24 L30 24 L30 32 L34 32 L34 14 L30 14 L30 10 L26 10 L26 14 L22 14 L22 10 L18 10 L18 14 Z" 
        fill="url(#iconLeftTower)"
      />
      
      {/* Right Castle Tower */}
      <path 
        d="M46 14 L46 32 L50 32 L50 24 L54 24 L54 32 L58 32 L58 24 L62 24 L62 32 L66 32 L66 14 L62 14 L62 10 L58 10 L58 14 L54 14 L54 10 L50 10 L50 14 Z" 
        fill="url(#iconRightTower)"
      />
      
      {/* Key Head */}
      <circle cx="40" cy="42" r="10" fill="white"/>
      <circle cx="40" cy="42" r="5" fill="url(#iconShieldGradient)"/>
      
      {/* Key Shaft */}
      <rect x="36" y="52" width="8" height="32" fill="white"/>
      
      {/* Key Teeth */}
      <rect x="44" y="66" width="10" height="5" fill="white"/>
      <rect x="44" y="76" width="8" height="5" fill="white"/>
      
      {/* Bottom Chevron */}
      <path 
        d="M18 72 L40 92 L62 72 L56 72 L40 86 L24 72 Z" 
        fill="#1B4A6D"
      />
    </svg>
  );
}

/**
 * Brand colors export for consistent styling
 */
export const BastionAuthColors = {
  navy: '#1B4A7D',
  teal: '#2B9E8B',
  darkNavy: '#1B3A5D',
  lightTeal: '#3B9B9B',
  gradient: 'linear-gradient(135deg, #2B9E8B 0%, #3B8B9E 50%, #1B4A7D 100%)',
} as const;
