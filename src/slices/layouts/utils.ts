/**
 * Changes the body attribute
 */
const changeHTMLAttribute = (attribute: string, value: string): boolean => {
    if (document.documentElement) {
        document.documentElement.setAttribute(attribute, value);
    }
    return true;
};

/**
 * Storage helpers
 */
const setLocalStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const getLocalStorage = (key: string) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
};

const updateLocalStorage = (key: string, updatedValues: any) => {
    const existing = getLocalStorage(key) || {};
    const newData = { ...existing, ...updatedValues };
    setLocalStorage(key, newData);
};

const presetColors: Record<string, string> = {
    red: "#ee6352",
    orange: "#ff7043",
    cyan: "#06b6d4",
    pink: "#ec4899",
    yellow: "#f59e0b",
    dark: "#374151",
};

const hexToRgb = (hex: string): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : null;
};

const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.max(0, Math.min(255, Math.round(R * (1 - percent))));
    G = Math.max(0, Math.min(255, Math.round(G * (1 - percent))));
    B = Math.max(0, Math.min(255, Math.round(B * (1 - percent))));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
};

const applyCustomThemeColor = (colorValue: string) => {
    if (typeof document === "undefined") return;
    const docEl = document.documentElement;
    const customProps = [
        "--vz-primary",
        "--vz-primary-rgb",
        "--vz-primary-bg-subtle",
        "--vz-primary-border-subtle",
        "--vz-primary-text-emphasis"
    ];

    const builtInColors = ["default", "green", "purple", "blue"];
    if (builtInColors.includes(colorValue)) {
        customProps.forEach(prop => docEl.style.removeProperty(prop));
        docEl.setAttribute("data-theme-colors", colorValue);
        return;
    }

    // Get target hex
    let hex = colorValue;
    if (presetColors[colorValue]) {
        hex = presetColors[colorValue];
    }

    if (hex && hex.startsWith("#")) {
        const rgb = hexToRgb(hex);
        if (rgb) {
            docEl.style.setProperty("--vz-primary", hex);
            docEl.style.setProperty("--vz-primary-rgb", rgb);
            docEl.style.setProperty("--vz-primary-bg-subtle", `rgba(${rgb}, 0.15)`);
            docEl.style.setProperty("--vz-primary-border-subtle", `rgba(${rgb}, 0.30)`);
            docEl.style.setProperty("--vz-primary-text-emphasis", shadeColor(hex, 0.25));
            docEl.setAttribute("data-theme-colors", "custom");
        }
    }
};

export { changeHTMLAttribute, setLocalStorage, getLocalStorage, updateLocalStorage, applyCustomThemeColor };