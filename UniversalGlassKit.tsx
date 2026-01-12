/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     UNIVERSAL GLASS KIT - React                           ║
 * ║                                                                           ║
 * ║  Premium frosted glass components for React/Next.js                       ║
 * ║  Works on dark backgrounds (#000 to #1a1a1a)                              ║
 * ║                                                                           ║
 * ║  Created by: TimeMachine AI                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * HOW TO USE:
 * 1. Copy this file into your project
 * 2. Import what you need: import { GlassButton, GlassInput } from './UniversalGlassKit'
 * 3. Use the components: <GlassButton><PlusIcon /></GlassButton>
 *
 * PROPS:
 * - accentColor: 'purple' | 'pink' | 'cyan' | 'green' | 'orange' | 'blue'
 * - All standard HTML attributes are passed through
 */

import React, { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STYLES - The core glass effect
// ═══════════════════════════════════════════════════════════════════════════

const accentColors = {
  purple: '139, 0, 255',
  pink: '236, 72, 153',
  cyan: '34, 211, 238',
  green: '34, 197, 94',
  orange: '249, 115, 22',
  blue: '59, 130, 246',
} as const;

type AccentColor = keyof typeof accentColors;

const baseGlassStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: `
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15)
  `.trim(),
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
};

const getHoverStyle = (accent: string): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.08)',
  borderColor: 'rgba(255, 255, 255, 0.15)',
  boxShadow: `
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(${accent}, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2)
  `.trim(),
});

const getFocusStyle = (accent: string): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.08)',
  borderColor: `rgba(${accent}, 0.4)`,
  boxShadow: `
    0 0 0 3px rgba(${accent}, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 30px rgba(${accent}, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2)
  `.trim(),
});


// ═══════════════════════════════════════════════════════════════════════════
// GLASS BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  accentColor?: AccentColor;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ children, accentColor = 'purple', style, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const accent = accentColors[accentColor];

    const buttonStyle: React.CSSProperties = {
      ...baseGlassStyle,
      borderRadius: '50%',
      padding: '14px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      ...(isHovered ? getHoverStyle(accent) : {}),
      ...style,
    };

    return (
      <button
        ref={ref}
        style={buttonStyle}
        onMouseEnter={(e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';


// ═══════════════════════════════════════════════════════════════════════════
// GLASS INPUT
// ═══════════════════════════════════════════════════════════════════════════

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  accentColor?: AccentColor;
  containerStyle?: React.CSSProperties;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ accentColor = 'purple', style, containerStyle, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const accent = accentColors[accentColor];

    const wrapperStyle: React.CSSProperties = {
      ...baseGlassStyle,
      borderRadius: '28px',
      position: 'relative',
      ...(isFocused ? getFocusStyle(accent) : isHovered ? getHoverStyle(accent) : {}),
      ...containerStyle,
    };

    const inputStyle: React.CSSProperties = {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      width: '100%',
      padding: '16px 24px',
      color: 'white',
      fontSize: '15px',
      lineHeight: '1.5',
      ...style,
    };

    return (
      <div
        style={wrapperStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input
          ref={ref}
          style={inputStyle}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';


// ═══════════════════════════════════════════════════════════════════════════
// GLASS TEXTAREA
// ═══════════════════════════════════════════════════════════════════════════

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  accentColor?: AccentColor;
  containerStyle?: React.CSSProperties;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ accentColor = 'purple', style, containerStyle, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const accent = accentColors[accentColor];

    const wrapperStyle: React.CSSProperties = {
      ...baseGlassStyle,
      borderRadius: '28px',
      position: 'relative',
      ...(isFocused ? getFocusStyle(accent) : isHovered ? getHoverStyle(accent) : {}),
      ...containerStyle,
    };

    const textareaStyle: React.CSSProperties = {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      width: '100%',
      padding: '16px 24px',
      color: 'white',
      fontSize: '15px',
      lineHeight: '1.5',
      resize: 'none',
      minHeight: '56px',
      maxHeight: '200px',
      ...style,
    };

    return (
      <div
        style={wrapperStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <textarea
          ref={ref}
          style={textareaStyle}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';


// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD
// ═══════════════════════════════════════════════════════════════════════════

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accentColor?: AccentColor;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, accentColor = 'purple', style, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const accent = accentColors[accentColor];

    const cardStyle: React.CSSProperties = {
      ...baseGlassStyle,
      borderRadius: '20px',
      padding: '24px',
      ...(isHovered ? getHoverStyle(accent) : {}),
      ...style,
    };

    return (
      <div
        ref={ref}
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';


// ═══════════════════════════════════════════════════════════════════════════
// GLASS DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════

interface GlassDropdownProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const GlassDropdown = forwardRef<HTMLDivElement, GlassDropdownProps>(
  ({ children, style, ...props }, ref) => {
    const dropdownStyle: React.CSSProperties = {
      background: `
        linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 2px, transparent 20px),
        rgba(20, 20, 25, 0.7)
      `.trim(),
      backdropFilter: 'blur(80px)',
      WebkitBackdropFilter: 'blur(80px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: `
        0 0 0 0.5px rgba(255, 255, 255, 0.1),
        0 25px 50px -12px rgba(0, 0, 0, 0.5),
        0 12px 24px -8px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.12)
      `.trim(),
      ...style,
    };

    return (
      <div ref={ref} style={dropdownStyle} {...props}>
        {children}
      </div>
    );
  }
);

GlassDropdown.displayName = 'GlassDropdown';


// ═══════════════════════════════════════════════════════════════════════════
// GLASS DROPDOWN ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface GlassDropdownItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const GlassDropdownItem = forwardRef<HTMLDivElement, GlassDropdownItemProps>(
  ({ children, style, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const itemStyle: React.CSSProperties = {
      padding: '12px 20px',
      color: 'rgba(255, 255, 255, 0.8)',
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
      background: isHovered
        ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%)'
        : 'transparent',
      ...style,
    };

    return (
      <div
        ref={ref}
        style={itemStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassDropdownItem.displayName = 'GlassDropdownItem';


// ═══════════════════════════════════════════════════════════════════════════
// GLASS DIVIDER
// ═══════════════════════════════════════════════════════════════════════════

export const GlassDivider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      height: '1px',
      margin: '0 16px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent 100%)',
      ...style,
    }}
  />
);


// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════
/*

import { GlassButton, GlassInput, GlassTextarea, GlassCard, GlassDropdown, GlassDropdownItem, GlassDivider } from './UniversalGlassKit';
import { Plus, Send } from 'lucide-react';

// Button
<GlassButton onClick={() => console.log('clicked')}>
  <Plus size={20} />
</GlassButton>

// Pink button
<GlassButton accentColor="pink">
  <Send size={20} />
</GlassButton>

// Input
<GlassInput placeholder="Type here..." />

// Textarea
<GlassTextarea placeholder="Write your message..." rows={3} />

// Card
<GlassCard>
  <h2>Hello</h2>
  <p>This is a glass card</p>
</GlassCard>

// Dropdown
<GlassDropdown>
  <GlassDropdownItem>Option 1</GlassDropdownItem>
  <GlassDivider />
  <GlassDropdownItem>Option 2</GlassDropdownItem>
</GlassDropdown>

*/
