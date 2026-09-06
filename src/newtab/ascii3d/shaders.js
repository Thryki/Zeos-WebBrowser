// Post-processing shaders for the 3D ASCII / dither new-tab background.
// Ported from "Razi's 3D ASCII & Dither Lab"; the GLSL is kept byte-identical
// to the original so the rendered output matches the reference tool exactly.

import * as THREE from 'three';

export const LevelsEffect = {
  uniforms: {
    'tDiffuse': { value: null },
    'uBrightness': { value: 0.0 },
    'uContrast': { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uBrightness;
    uniform float uContrast;
    varying vec2 vUv;
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb += uBrightness;
      color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
      gl_FragColor = color;
    }
  `
};

export const ASCIIEffect = {
  uniforms: {
    'tDiffuse': { value: null },
    'uResolution': { value: new THREE.Vector2() },
    'uCharSize': { value: new THREE.Vector2(8.0, 8.0) },
    'uCharSet': { value: null },
    'uCharCount': { value: 0 },
    'uColor': { value: new THREE.Color(0x000000) },
    'uBackgroundColor': { value: new THREE.Color(0xffffff) },
    'uUsePalette': { value: false },
    'uPaletteMap': { value: null },
    'uPaletteColorCount': { value: 0.0 },
    'uUseColorTrio': { value: false },
    'uColorTrio': { value: [new THREE.Color(0x000000), new THREE.Color(0x333333), new THREE.Color(0x666666)] }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform vec2 uCharSize;
    uniform sampler2D uCharSet;
    uniform float uCharCount;
    uniform vec3 uColor;
    uniform vec3 uBackgroundColor;
    uniform bool uUsePalette;
    uniform sampler2D uPaletteMap;
    uniform float uPaletteColorCount;
    uniform bool uUseColorTrio;
    uniform vec3 uColorTrio[3];
    varying vec2 vUv;
    
    float getLuminance(vec3 color) {
      return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    }
    
    vec3 getCharacterColor(float luminance) {
      if (!uUseColorTrio) {
        return uColor;
      }
      
      // Map luminance to discrete color zones (no blending)
      if (luminance < 0.33) {
        // Dark/shadow areas
        return uColorTrio[0];
      } else if (luminance < 0.66) {
        // Mid-tone areas
        return uColorTrio[1];
      } else {
        // Bright/highlight areas
        return uColorTrio[2];
      }
    }
    
    void main() {
      vec2 tileUV = floor(vUv * uResolution / uCharSize) * uCharSize / uResolution;
      vec4 originalColor = texture2D(tDiffuse, tileUV);
      float luminance = getLuminance(originalColor.rgb);
      
      vec3 finalBackgroundColor;
      if (uUsePalette && uPaletteColorCount > 0.0) {
        float colorIndex = floor(luminance * (uPaletteColorCount - 0.999));
        float colorU = (colorIndex + 0.5) / uPaletteColorCount;
        finalBackgroundColor = texture2D(uPaletteMap, vec2(colorU, 0.5)).rgb;
      } else {
        finalBackgroundColor = uBackgroundColor;
      }
      
      float charIndex = floor(luminance * (uCharCount - 0.999));
      vec2 charUV = (vUv * uResolution / uCharSize) - floor(vUv * uResolution / uCharSize);
      charUV.x /= uCharCount;
      charUV.x += charIndex / uCharCount;
      vec4 charTexel = texture2D(uCharSet, charUV);
      
      vec3 characterColor = getCharacterColor(luminance);
      gl_FragColor = vec4(mix(finalBackgroundColor, characterColor, charTexel.r), 1.0);
    }
  `
};

export const DitherEffect = {
  uniforms: {
    'tDiffuse': { value: null },
    'uResolution': { value: new THREE.Vector2() },
    'uPaletteMap': { value: null },
    'uPaletteColorCount': { value: 0.0 },
    'uMatrixType': { value: 2 },
    'uDitherScale': { value: 3.0 },
    'uDitherMode': { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform sampler2D uPaletteMap;
    uniform float uPaletteColorCount;
    uniform int uMatrixType;
    uniform float uDitherScale;
    uniform int uDitherMode;
    varying vec2 vUv;
    
    float getLuminance(vec3 color) {
      return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    }
    
    float rand(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    
    float getBayerValue(int x, int y) {
      const float bayer2[4] = float[](0.0, 2.0, 3.0, 1.0);
      const float bayer4[16] = float[](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
      const float bayer8[64] = float[](0.0, 32.0, 8.0, 40.0, 2.0, 34.0, 10.0, 42.0, 48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0, 12.0, 44.0, 4.0, 36.0, 14.0, 46.0, 6.0, 38.0, 60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0, 3.0, 35.0, 11.0, 43.0, 1.0, 33.0, 9.0, 41.0, 51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0, 15.0, 47.0, 7.0, 39.0, 13.0, 45.0, 5.0, 37.0, 63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0);
      const float bayer16[256] = float[](0.0, 128.0, 32.0, 160.0, 8.0, 136.0, 40.0, 168.0, 2.0, 130.0, 34.0, 162.0, 10.0, 138.0, 42.0, 170.0, 192.0, 64.0, 224.0, 96.0, 200.0, 72.0, 232.0, 104.0, 194.0, 66.0, 226.0, 98.0, 202.0, 74.0, 234.0, 106.0, 48.0, 176.0, 16.0, 144.0, 56.0, 184.0, 24.0, 152.0, 50.0, 178.0, 18.0, 146.0, 58.0, 186.0, 26.0, 154.0, 240.0, 112.0, 208.0, 80.0, 248.0, 120.0, 216.0, 88.0, 242.0, 114.0, 210.0, 82.0, 250.0, 122.0, 218.0, 90.0, 12.0, 140.0, 44.0, 172.0, 4.0, 132.0, 36.0, 164.0, 14.0, 142.0, 46.0, 174.0, 6.0, 134.0, 38.0, 166.0, 204.0, 76.0, 236.0, 108.0, 196.0, 68.0, 228.0, 100.0, 206.0, 78.0, 238.0, 110.0, 198.0, 70.0, 230.0, 102.0, 60.0, 188.0, 28.0, 156.0, 52.0, 180.0, 20.0, 148.0, 62.0, 190.0, 30.0, 158.0, 54.0, 182.0, 22.0, 150.0, 252.0, 124.0, 220.0, 92.0, 244.0, 116.0, 212.0, 84.0, 254.0, 126.0, 222.0, 94.0, 246.0, 118.0, 214.0, 86.0, 3.0, 131.0, 35.0, 163.0, 11.0, 139.0, 43.0, 171.0, 1.0, 129.0, 33.0, 161.0, 9.0, 137.0, 41.0, 169.0, 195.0, 67.0, 227.0, 99.0, 203.0, 75.0, 235.0, 107.0, 193.0, 65.0, 225.0, 97.0, 201.0, 73.0, 233.0, 105.0, 51.0, 179.0, 19.0, 147.0, 59.0, 187.0, 27.0, 155.0, 49.0, 177.0, 17.0, 145.0, 57.0, 185.0, 25.0, 153.0, 243.0, 115.0, 211.0, 83.0, 251.0, 123.0, 219.0, 91.0, 241.0, 113.0, 209.0, 81.0, 249.0, 121.0, 217.0, 89.0, 15.0, 143.0, 47.0, 175.0, 7.0, 135.0, 39.0, 167.0, 13.0, 141.0, 45.0, 173.0, 5.0, 133.0, 37.0, 165.0, 207.0, 79.0, 239.0, 111.0, 199.0, 71.0, 231.0, 103.0, 205.0, 77.0, 237.0, 109.0, 197.0, 69.0, 229.0, 101.0, 63.0, 191.0, 31.0, 159.0, 55.0, 183.0, 23.0, 151.0, 61.0, 189.0, 29.0, 157.0, 53.0, 181.0, 21.0, 149.0, 255.0, 127.0, 223.0, 95.0, 247.0, 119.0, 215.0, 87.0, 253.0, 125.0, 221.0, 93.0, 245.0, 117.0, 213.0, 85.0);
      
      if (uMatrixType == 0) { return bayer2[x + y * 2] / 4.0; }
      if (uMatrixType == 1) { return bayer4[x + y * 4] / 16.0; }
      if (uMatrixType == 2) { return bayer8[x + y * 8] / 64.0; }
      if (uMatrixType == 3) { return bayer16[x + y * 16] / 256.0; }
      return 0.0;
    }
    
    void main() {
      vec3 originalColor = texture2D(tDiffuse, vUv).rgb;
      float luminance = getLuminance(originalColor);
      float threshold;
      
      if (uDitherMode == 0) {
        int matrixSize;
        if (uMatrixType == 0) { matrixSize = 2; }
        else if (uMatrixType == 1) { matrixSize = 4; }
        else if (uMatrixType == 3) { matrixSize = 16; }
        else { matrixSize = 8; }
        
        int x = int(mod(gl_FragCoord.x, float(matrixSize)));
        int y = int(mod(gl_FragCoord.y, float(matrixSize)));
        threshold = getBayerValue(x, y);
      } else {
        threshold = rand(vUv);
      }
      
      float adjustedLuminance = luminance + (threshold - 0.5) / uDitherScale;
      float colorIndex = floor(adjustedLuminance * (uPaletteColorCount - 0.999));
      float colorU = (colorIndex + 0.5) / uPaletteColorCount;
      vec3 finalColor = texture2D(uPaletteMap, vec2(colorU, 0.5)).rgb;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function createAsciiCharTexture(characters, scale, fontFamily) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const charSize = 64;
  const charArray = Array.from(characters);
  
  canvas.width = charSize * charArray.length;
  canvas.height = charSize;
  
  ctx.fillStyle = 'white';
  ctx.font = `${charSize * scale}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i < charArray.length; i++) {
    ctx.fillText(charArray[i], i * charSize + charSize / 2, charSize / 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return { texture, count: charArray.length };
}

export function createPaletteTexture(colorStops) {
  const canvas = document.createElement('canvas');
  const width = colorStops.length > 0 ? colorStops.length : 1;
  const height = 1;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (colorStops.length === 0) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  } else {
    // Create discrete color bands instead of gradient
    colorStops.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i, 0, 1, height);
    });
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  // Use nearest neighbor filtering to prevent color interpolation
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  
  return texture;
}