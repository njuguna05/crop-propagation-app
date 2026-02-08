import React from 'react';

const FloraTrackLogo = ({
  width = 200,
  height = 60,
  showText = true,
  className = "",
  variant = "default" // "default", "light", "dark", "minimal"
}) => {
  // Color schemes for different variants
  const colorSchemes = {
    default: {
      primary: "#16a34a", // green-600
      secondary: "#22c55e", // green-500
      accent: "#15803d", // green-700
      text: "#1f2937", // gray-800
      leaf1: "#10b981", // emerald-500
      leaf2: "#059669", // emerald-600
    },
    light: {
      primary: "#22c55e",
      secondary: "#4ade80",
      accent: "#16a34a",
      text: "#374151",
      leaf1: "#34d399",
      leaf2: "#10b981",
    },
    dark: {
      primary: "#22c55e",
      secondary: "#4ade80",
      accent: "#16a34a",
      text: "#ffffff",
      leaf1: "#34d399",
      leaf2: "#10b981",
    },
    minimal: {
      primary: "#16a34a",
      secondary: "#16a34a",
      accent: "#15803d",
      text: "#1f2937",
      leaf1: "#16a34a",
      leaf2: "#15803d",
    }
  };

  const colors = colorSchemes[variant];

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg
        width={showText ? width * 0.3 : width}
        height={height}
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle for the icon */}
        <circle
          cx="60"
          cy="40"
          r="35"
          fill="url(#backgroundGradient)"
          stroke={colors.accent}
          strokeWidth="2"
        />

        {/* Main plant stem */}
        <path
          d="M60 65 L60 25"
          stroke={colors.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Left leaves */}
        <path
          d="M60 35 Q45 30 40 25 Q45 35 60 35"
          fill={colors.leaf1}
          stroke={colors.primary}
          strokeWidth="1"
        />
        <path
          d="M60 45 Q42 40 35 35 Q42 50 60 45"
          fill={colors.leaf2}
          stroke={colors.primary}
          strokeWidth="1"
        />

        {/* Right leaves */}
        <path
          d="M60 35 Q75 30 80 25 Q75 35 60 35"
          fill={colors.leaf1}
          stroke={colors.primary}
          strokeWidth="1"
        />
        <path
          d="M60 45 Q78 40 85 35 Q78 50 60 45"
          fill={colors.leaf2}
          stroke={colors.primary}
          strokeWidth="1"
        />

        {/* Top sprouting leaves */}
        <path
          d="M60 25 Q55 20 50 18 Q55 25 60 25"
          fill={colors.secondary}
          stroke={colors.primary}
          strokeWidth="1"
        />
        <path
          d="M60 25 Q65 20 70 18 Q65 25 60 25"
          fill={colors.secondary}
          stroke={colors.primary}
          strokeWidth="1"
        />

        {/* Root system indication */}
        <circle
          cx="60"
          cy="65"
          r="4"
          fill={colors.accent}
        />
        <path
          d="M56 67 Q52 70 48 72"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M64 67 Q68 70 72 72"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Growth tracking dots */}
        <circle cx="45" cy="55" r="2" fill={colors.secondary} opacity="0.6" />
        <circle cx="52" cy="58" r="1.5" fill={colors.secondary} opacity="0.4" />
        <circle cx="68" cy="58" r="1.5" fill={colors.secondary} opacity="0.4" />
        <circle cx="75" cy="55" r="2" fill={colors.secondary} opacity="0.6" />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.1" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <div className="ml-3">
          <div
            className="font-bold tracking-tight"
            style={{
              fontSize: `${height * 0.35}px`,
              color: colors.text,
              lineHeight: 1
            }}
          >
            Flora
            <span style={{ color: colors.primary }}>Track</span>
          </div>
          <div
            className="text-xs font-medium opacity-75"
            style={{
              fontSize: `${height * 0.15}px`,
              color: colors.text,
              lineHeight: 1,
              marginTop: '2px'
            }}
          >
            Crop Propagation Management
          </div>
        </div>
      )}
    </div>
  );
};

// Preset size variants
export const FloraTrackLogoSmall = (props) => (
  <FloraTrackLogo width={120} height={36} {...props} />
);

export const FloraTrackLogoMedium = (props) => (
  <FloraTrackLogo width={180} height={54} {...props} />
);

export const FloraTrackLogoLarge = (props) => (
  <FloraTrackLogo width={240} height={72} {...props} />
);

// Icon-only version
export const FloraTrackIcon = (props) => (
  <FloraTrackLogo showText={false} width={40} height={40} {...props} />
);

export default FloraTrackLogo;