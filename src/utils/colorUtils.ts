// src/utils/colorUtils.ts (assuming this path)

export interface RGB { r: number | ''; g: number | ''; b: number | ''; } // Allow empty string for temporary input state
export interface HSV { h: number; s: number; v: number; }
export interface HSL { h: number; s: number; l: number; }

// Simple validator for 3 or 6 digit hex codes (with optional #)
export const isValidHex = (hex: string): boolean => /^#?([0-9A-Fa-f]{3}){1,2}$/i.test(hex);

// Converts HEX string (expects 6 digits after #) to RGB object {r, g, b} (0-255)
export const hexToRgbObj = (hex: string): { r: number; g: number; b: number; } | null => {
    // Remove # if present
    const sanitizedHex = hex.startsWith('#') ? hex.slice(1) : hex;

    // Expand 3-digit hex to 6-digit hex if necessary (makes parsing consistent)
    let fullHex = sanitizedHex;
    if (sanitizedHex.length === 3 && isValidHex(sanitizedHex)) {
        const r = sanitizedHex[0];
        const g = sanitizedHex[1];
        const b = sanitizedHex[2];
        fullHex = `${r}${r}${g}${g}${b}${b}`;
    }

    // Now parse the 6-digit hex
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
};

// Converts RGB object {r, g, b} (0-255) to HEX string
// Ensures numeric values before conversion
export const rgbObjToHex = ({ r, g, b }: { r: number | string; g: number | string; b: number | string }): string => {
    const numR = Number(r);
    const numG = Number(g);
    const numB = Number(b);

    // Handle cases where inputs might not be valid numbers yet (e.g., empty string)
    if (isNaN(numR) || isNaN(numG) || isNaN(numB)) {
        console.warn("Invalid RGB value passed to rgbObjToHex", { r, g, b });
        // Return a default or throw error, depending on desired behavior
        return '#000000'; // Defaulting to black for safety
    }

    return `#${[numR, numG, numB].map(x => {
        // Clamp and round *numeric* values
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
};


// Converts RGB object {r, g, b} (0-255) to HSV object {h(0-360), s(0-1), v(0-1)}
// Ensures numeric values before conversion
export const rgbToHsv = ({ r, g, b }: { r: number | string; g: number | string; b: number | string }): HSV => {
    let numR = Number(r) / 255;
    let numG = Number(g) / 255;
    let numB = Number(b) / 255;

    // Handle non-numeric inputs gracefully
     if (isNaN(numR) || isNaN(numG) || isNaN(numB)) {
        console.warn("Invalid RGB value passed to rgbToHsv", { r, g, b });
        numR = 0; numG = 0; numB = 0; // Default to black's values
    }

    const max = Math.max(numR, numG, numB);
    const min = Math.min(numR, numG, numB);
    let h = 0, s = 0;
    const v = max; // Value is the max of R, G, B

    const d = max - min;
    s = max === 0 ? 0 : d / max; // Saturation

    if (max !== min) { // Hue calculation
        switch (max) {
            case numR: h = (numG - numB) / d + (numG < numB ? 6 : 0); break;
            case numG: h = (numB - numR) / d + 2; break;
            case numB: h = (numR - numG) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s, v };
};

// Converts HSV object {h(0-360), s(0-1), v(0-1)} to RGB object {r, g, b} (0-255)
export const hsvToRgb = ({ h, s, v }: HSV): { r: number; g: number; b: number; } => {
    let r = 0, g = 0, b = 0;
    let hue = h;
    if (hue >= 360) hue = 0; // Normalize hue to be < 360
    hue /= 60; // sector 0 to 5

    const i = Math.floor(hue);
    const f = hue - i; // factorial part of hue
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
};

// Simple approximation of adjusting brightness (value) for the slider
export const adjustHsvBrightness = (colorHex: string, factor: number): string => {
    const rgb = hexToRgbObj(colorHex);
    if (!rgb) return colorHex; // Return original if hex is invalid
    let hsv = rgbToHsv(rgb);
    hsv.v *= Math.max(0, Math.min(1, factor)); // Adjust Value (brightness)
    const newRgb = hsvToRgb(hsv);
    return rgbObjToHex(newRgb);
};

// Helper to get a base color (full brightness/value) from a hex code
export const getBaseColorFromHex = (hex: string): string => {
     const rgb = hexToRgbObj(hex);
     if (!rgb) return '#FFFFFF'; // Default white if invalid (or maybe black #000000?)
     let hsv = rgbToHsv(rgb);
     hsv.v = 1; // Set Value to max (full brightness)
     hsv.s = 1; // Often want full saturation too for the base color wheel color
     // Exception: If original saturation was 0 (grayscale), keep it 0.
     if (rgbToHsv(rgb).s === 0) {
         hsv.s = 0;
     }
     return rgbObjToHex(hsvToRgb(hsv));
};

// Helper to get intensity (value/brightness) from a hex code
export const getIntensityFromHex = (hex: string): number => {
     const rgb = hexToRgbObj(hex);
     if (!rgb) return 100; // Default full intensity if invalid
     let hsv = rgbToHsv(rgb);
     return Math.round(hsv.v * 100); // Return Value as percentage
};

// --- End Color Conversion Helpers ---