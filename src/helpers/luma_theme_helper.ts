export interface LumaThemeConfig {
  background: 'default' | 'solid-indigo' | 'midnight-gradient' | 'aurora-glow' | 'pastel-mesh' | 'clean-white-glass' | 'cyberpunk-grid';
  fontFamily: 'Outfit' | 'Inter' | 'Space Grotesk' | 'Poppins' | 'Montserrat';
  borderRadius: '0px' | '6px' | '12px' | '18px' | '26px';
  borderStyle: 'thin' | 'shadow-only' | 'neon-glow' | 'glass-border';
  accentPreset: 'default' | 'orchid' | 'teal-breeze' | 'sunset' | 'nordic-slate' | 'cyberpunk' | 'emerald';
  glassOpacity: number; // 0.4 to 1.0
  glassBlur: number; // 0 to 25 px
}

export const DEFAULT_LUMA_THEME: LumaThemeConfig = {
  background: 'default',
  fontFamily: 'Outfit',
  borderRadius: '12px',
  borderStyle: 'thin',
  accentPreset: 'default',
  glassOpacity: 1.0,
  glassBlur: 0,
};

const fontUrls: Record<string, string> = {
  'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap'
};

const accentColors: Record<string, { hex: string, rgb: string, textShade: string }> = {
  'orchid': { hex: '#8b5cf6', rgb: '139, 92, 246', textShade: '#6d28d9' }, // Soft Violet
  'teal-breeze': { hex: '#14b8a6', rgb: '20, 184, 166', textShade: '#0f766e' }, // Muted Teal
  'sunset': { hex: '#d97706', rgb: '217, 119, 6', textShade: '#b45309' }, // Terracotta / Amber
  'nordic-slate': { hex: '#64748b', rgb: '100, 116, 139', textShade: '#334155' }, // Premium Slate
  'cyberpunk': { hex: '#0284c7', rgb: '2, 132, 199', textShade: '#0369a1' }, // Soft Sky Blue
  'emerald': { hex: '#059669', rgb: '5, 150, 105', textShade: '#047857' } // Elegant Sage
};

export const getLumaTheme = (): LumaThemeConfig => {
  if (typeof window === 'undefined') return DEFAULT_LUMA_THEME;
  const stored = localStorage.getItem('luma-premium-theme');
  if (!stored) return DEFAULT_LUMA_THEME;
  try {
    return { ...DEFAULT_LUMA_THEME, ...JSON.parse(stored) };
  } catch (e) {
    return DEFAULT_LUMA_THEME;
  }
};

export const saveLumaTheme = (config: LumaThemeConfig) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('luma-premium-theme', JSON.stringify(config));
  applyLumaTheme(config);
};

export const applyLumaTheme = (config: LumaThemeConfig) => {
  if (typeof document === 'undefined') return;
  const docEl = document.documentElement;

  // 1. Apply Font
  const fontUrl = fontUrls[config.fontFamily];
  if (fontUrl) {
    let linkEl = document.getElementById('luma-font-stylesheet') as HTMLLinkElement;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = 'luma-font-stylesheet';
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }
    if (linkEl.href !== fontUrl) {
      linkEl.href = fontUrl;
    }
    docEl.style.setProperty('--luma-font-family', `'${config.fontFamily}', sans-serif`);
  }

  // 2. Apply Border Radius
  docEl.style.setProperty('--luma-border-radius', config.borderRadius);

  // 3. Apply Accent Colors
  const accent = accentColors[config.accentPreset];
  if (accent && config.accentPreset !== 'default') {
    docEl.style.setProperty('--vz-primary', accent.hex);
    docEl.style.setProperty('--vz-primary-rgb', accent.rgb);
    docEl.style.setProperty('--vz-primary-bg-subtle', `rgba(${accent.rgb}, 0.12)`);
    docEl.style.setProperty('--vz-primary-border-subtle', `rgba(${accent.rgb}, 0.25)`);
    docEl.style.setProperty('--vz-primary-text-emphasis', accent.textShade);
    docEl.style.setProperty('--luma-accent-glow', `rgba(${accent.rgb}, 0.4)`);
  } else {
    // Revert accent override to allow default colors
    docEl.style.removeProperty('--vz-primary');
    docEl.style.removeProperty('--vz-primary-rgb');
    docEl.style.removeProperty('--vz-primary-bg-subtle');
    docEl.style.removeProperty('--vz-primary-border-subtle');
    docEl.style.removeProperty('--vz-primary-text-emphasis');
    docEl.style.removeProperty('--luma-accent-glow');
  }

  // 4. Apply Background Customization
  // Clear previous properties
  docEl.style.removeProperty('--luma-body-bg-image');
  docEl.style.removeProperty('--luma-body-bg');
  docEl.style.removeProperty('--luma-card-bg');
  docEl.style.removeProperty('--luma-sidebar-bg');
  docEl.style.removeProperty('--luma-header-bg');
  docEl.style.removeProperty('--luma-border-color');
  docEl.removeAttribute('data-luma-bg');

  if (config.background !== 'default') {
    docEl.setAttribute('data-luma-bg', config.background);
    
    if (config.background === 'solid-indigo') {
      docEl.style.setProperty('--luma-body-bg', '#0f1129');
      docEl.style.setProperty('--luma-card-bg', 'rgba(23, 26, 56, var(--luma-card-opacity, 1))');
      docEl.style.setProperty('--luma-sidebar-bg', '#141738');
      docEl.style.setProperty('--luma-header-bg', '#141738');
      docEl.style.setProperty('--luma-border-color', 'rgba(255, 255, 255, 0.08)');
    } else if (config.background === 'midnight-gradient') {
      docEl.style.setProperty('--luma-body-bg', '#06070b');
      docEl.style.setProperty('--luma-body-bg-image', 'linear-gradient(135deg, #06070b 0%, #15112e 50%, #06070b 100%)');
      docEl.style.setProperty('--luma-card-bg', 'rgba(18, 19, 31, var(--luma-card-opacity, 1))');
      docEl.style.setProperty('--luma-sidebar-bg', '#0b0c13');
      docEl.style.setProperty('--luma-header-bg', '#0b0c13');
      docEl.style.setProperty('--luma-border-color', 'rgba(255, 255, 255, 0.06)');
    } else if (config.background === 'aurora-glow') {
      docEl.style.setProperty('--luma-body-bg', '#050616');
      docEl.style.setProperty('--luma-body-bg-image', 'radial-gradient(at 0% 0%, rgba(131, 56, 236, 0.14) 0px, transparent 50%), radial-gradient(at 50% 0%, rgba(255, 0, 110, 0.07) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(58, 12, 163, 0.16) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(24, 78, 119, 0.12) 0px, transparent 50%)');
      docEl.style.setProperty('--luma-card-bg', 'rgba(15, 17, 41, var(--luma-card-opacity, 1))');
      docEl.style.setProperty('--luma-sidebar-bg', 'rgba(8, 9, 28, 0.9)');
      docEl.style.setProperty('--luma-header-bg', 'rgba(8, 9, 28, 0.9)');
      docEl.style.setProperty('--luma-border-color', 'rgba(255, 255, 255, 0.07)');
    } else if (config.background === 'cyberpunk-grid') {
      docEl.style.setProperty('--luma-body-bg', '#03030c');
      docEl.style.setProperty('--luma-body-bg-image', 'linear-gradient(rgba(18, 16, 35, 0.8) 0%, rgba(3, 3, 12, 1) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)');
      // Reusable grid background in CSS using background-size
      docEl.style.setProperty('--luma-card-bg', 'rgba(11, 11, 23, var(--luma-card-opacity, 1))');
      docEl.style.setProperty('--luma-sidebar-bg', '#060614');
      docEl.style.setProperty('--luma-header-bg', '#060614');
      docEl.style.setProperty('--luma-border-color', 'rgba(6, 182, 212, 0.15)');
    } else if (config.background === 'pastel-mesh') {
      docEl.style.setProperty('--luma-body-bg', '#f4f6fa');
      docEl.style.setProperty('--luma-body-bg-image', 'radial-gradient(at 10% 20%, rgba(224, 231, 255, 0.6) 0px, transparent 50%), radial-gradient(at 90% 10%, rgba(253, 224, 241, 0.6) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(209, 250, 229, 0.5) 0px, transparent 50%)');
      docEl.style.setProperty('--luma-card-bg', 'rgba(255, 255, 255, var(--luma-card-opacity, 1))');
      docEl.style.setProperty('--luma-sidebar-bg', '#ffffff');
      docEl.style.setProperty('--luma-header-bg', '#ffffff');
      docEl.style.setProperty('--luma-border-color', 'rgba(0, 0, 0, 0.06)');
    } else if (config.background === 'clean-white-glass') {
      docEl.style.setProperty('--luma-body-bg', '#f9fafb');
      docEl.style.setProperty('--luma-body-bg-image', 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)');
      docEl.style.setProperty('--luma-card-bg', 'rgba(255, 255, 255, var(--luma-card-opacity, 1))');
      docEl.style.setProperty('--luma-sidebar-bg', 'rgba(255, 255, 255, 0.85)');
      docEl.style.setProperty('--luma-header-bg', 'rgba(255, 255, 255, 0.85)');
      docEl.style.setProperty('--luma-border-color', 'rgba(255, 255, 255, 0.45)');
    }
  }

  // 5. Apply Opacity & Blur (Glassmorphism)
  docEl.style.setProperty('--luma-card-opacity', config.glassOpacity.toString());
  docEl.style.setProperty('--luma-card-blur', `${config.glassBlur}px`);

  // 6. Apply Border Styles & Shadows
  docEl.style.removeProperty('--luma-card-border-style');
  docEl.style.removeProperty('--luma-card-border-width');
  docEl.style.removeProperty('--luma-card-border-color');
  docEl.style.removeProperty('--luma-card-shadow');
  docEl.style.removeProperty('--luma-card-glow');
  
  if (config.borderStyle === 'thin') {
    docEl.style.setProperty('--luma-card-border-style', 'solid');
    docEl.style.setProperty('--luma-card-border-width', '1px');
    docEl.style.setProperty('--luma-card-shadow', '0 2px 4px rgba(15, 23, 42, 0.08)');
  } else if (config.borderStyle === 'shadow-only') {
    docEl.style.setProperty('--luma-card-border-style', 'none');
    docEl.style.setProperty('--luma-card-border-width', '0px');
    docEl.style.setProperty('--luma-card-shadow', '0 10px 30px -5px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08)');
  } else if (config.borderStyle === 'neon-glow') {
    docEl.style.setProperty('--luma-card-border-style', 'solid');
    docEl.style.setProperty('--luma-card-border-width', '1px');
    const primaryColor = accent ? accent.hex : '#405189';
    docEl.style.setProperty('--luma-card-border-color', `rgba(${accent ? accent.rgb : '64, 81, 137'}, 0.25)`);
    docEl.style.setProperty('--luma-card-shadow', `0 0 15px -3px rgba(${accent ? accent.rgb : '64, 81, 137'}, 0.15)`);
    docEl.style.setProperty('--luma-card-glow', `0 0 8px rgba(${accent ? accent.rgb : '64, 81, 137'}, 0.1)`);
  } else if (config.borderStyle === 'glass-border') {
    docEl.style.setProperty('--luma-card-border-style', 'solid');
    docEl.style.setProperty('--luma-card-border-width', '1px');
    docEl.style.setProperty('--luma-card-border-color', 'rgba(255, 255, 255, 0.12)');
    docEl.style.setProperty('--luma-card-shadow', '0 8px 32px 0 rgba(0, 0, 0, 0.1)');
  }
};
