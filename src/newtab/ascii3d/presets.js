// Effect presets for the Zeos new-tab 3D ASCII / dither renderer.
//
// Ported verbatim from "Razi's 3D ASCII & Dither Lab" (src/app/utils/presets.ts).
// All credit for the preset design, character sets and palettes goes to that
// project; this file is a faithful, TypeScript-free ES module transcription —
// same names, same order, same values, same colour strings.
//
// Shape of an entry (was `interface EffectPreset`):
//   id: string
//   name: string
//   description: string
//   category: 'ascii' | 'dither' | 'mixed'
//   settings: {
//     effectType: 'ascii' | 'bayer' | 'noise' | 'none'
//     brightness?: number
//     contrast?: number
//     ascii?: {
//       font: string
//       characters: string
//       resolution: number
//       scale: number
//       color: string
//       colorTrio?: [string, string, string]
//       useColorTrio?: boolean
//     }
//     dither?: { matrixType: number, scale: number }
//     colors?: {
//       usePalette: boolean
//       background: string
//       palette: string[]
//       active: boolean[]
//     }
//   }

export const EFFECT_PRESETS = [
  // ASCII Presets
  {
    id: 'ascii-classic',
    name: 'Classic ASCII',
    description: 'Traditional text-based art',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.1,
      contrast: 1.2,
      ascii: {
        font: 'monospace',
        characters: ' .:-=+*#%@',
        resolution: 6,
        scale: 0.9,
        color: '#000000'
      },
      colors: {
        usePalette: false,
        background: '#ffffff',
        palette: ['#000000', '#ffffff'],
        active: [true, true]
      }
    }
  },
  {
    id: 'ascii-blocks',
    name: 'Block Art',
    description: 'Solid block characters for bold effects',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.0,
      contrast: 1.4,
      ascii: {
        font: 'monospace',
        characters: ' ░▒▓█',
        resolution: 8,
        scale: 1.0,
        color: '#1a1a1a'
      },
      colors: {
        usePalette: false,
        background: '#f0f0f0',
        palette: ['#1a1a1a', '#f0f0f0'],
        active: [true, true]
      }
    }
  },
  {
    id: 'ascii-geometric',
    name: 'Geometric Shapes',
    description: 'Modern geometric character set',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: -0.05,
      contrast: 1.3,
      ascii: {
        font: 'monospace',
        characters: ' ▗▖▞▚▘▄▀▐●□■',
        resolution: 7,
        scale: 0.95,
        color: '#2563eb'
      },
      colors: {
        usePalette: false,
        background: '#dbeafe',
        palette: ['#2563eb', '#dbeafe'],
        active: [true, true]
      }
    }
  },
  {
    id: 'ascii-symbols',
    name: 'Retro Symbols',
    description: 'Classic computer symbols with retro colors',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.10,
      contrast: 1.60,
      ascii: {
        font: 'VT323',
        characters: ' .·♠♣♥♦☺☻○●',
        resolution: 9,
        scale: 1.3,
        color: '#00aa00',
        colorTrio: ['#002200', '#00aa00', '#44ff44'],
        useColorTrio: true
      },
      colors: {
        usePalette: true,
        background: '#002200',
        palette: ['#002200', '#00aa00', '#ffdd00', '#ff6666', '#ffffff'],
        active: [true, true, true, true, true]
      }
    }
  },
  {
    id: 'ascii-vaporwave-neon',
    name: 'Vaporwave Neon',
    description: 'Electric neon symbols with vaporwave aesthetics',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.2,
      contrast: 1.8,
      ascii: {
        font: 'VT323',
        characters: ' ░▒▓◆◇○●◄►▲▼★☆※¤',
        resolution: 6,
        scale: 0.9,
        color: '#ff00ff',
        colorTrio: ['#440044', '#ff00ff', '#ff88ff'],
        useColorTrio: true
      },
      colors: {
        usePalette: true,
        background: '#0a0015',
        palette: ['#0a0015', '#ff00ff', '#00ffff', '#ff6ec7', '#bd00ff', '#00ff80'],
        active: [true, true, true, true, true, true]
      }
    }
  },
  {
    id: 'ascii-neon-cityscape',
    name: 'Neon Cityscape',
    description: 'Urban neon with building-like characters',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.12,
      contrast: 1.65,
      ascii: {
        font: 'Roboto Mono',
        characters: ' ░▒▓█▌▐▀▄■□▬▭▮▯◘◙',
        resolution: 7,
        scale: 1.0,
        color: '#00ff80',
        colorTrio: ['#003322', '#00ff80', '#66ffaa'],
        useColorTrio: true
      },
      colors: {
        usePalette: true,
        background: '#001122',
        palette: ['#001122', '#00ff80', '#ff0060', '#0080ff', '#ffff00', '#ff8000'],
        active: [true, true, true, true, true, true]
      }
    }
  },
  {
    id: 'ascii-dense',
    name: 'High Detail',
    description: 'Dense character set for maximum detail',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.0,
      contrast: 1.25,
      ascii: {
        font: 'Source Code Pro',
        characters: ' .+0█▙▟▛▜▝▘▗▖▞▚▄▀▐●□■_',
        resolution: 5,
        scale: 0.85,
        color: '#059669'
      },
      colors: {
        usePalette: false,
        background: '#ecfdf5',
        palette: ['#059669', '#ecfdf5'],
        active: [true, true]
      }
    }
  },
  {
    id: 'ascii-technical',
    name: 'Technical Style',
    description: 'Programming-inspired characters',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.1,
      contrast: 1.35,
      ascii: {
        font: 'Roboto Mono',
        characters: ' .-+*#|=<>{}[]()/',
        resolution: 6,
        scale: 0.9,
        color: '#7c3aed'
      },
      colors: {
        usePalette: false,
        background: '#faf5ff',
        palette: ['#7c3aed', '#faf5ff'],
        active: [true, true]
      }
    }
  },
  {
    id: 'ascii-minimal',
    name: 'Minimalist',
    description: 'Clean, simple character set',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.15,
      contrast: 1.5,
      ascii: {
        font: 'Space Mono',
        characters: ' ·•○●',
        resolution: 8,
        scale: 1.1,
        color: '#374151'
      },
      colors: {
        usePalette: false,
        background: '#f9fafb',
        palette: ['#374151', '#f9fafb'],
        active: [true, true]
      }
    }
  },
  {
    id: 'ascii-retro-gaming',
    name: 'Retro Gaming',
    description: '8-bit style characters',
    category: 'ascii',
    settings: {
      effectType: 'ascii',
      brightness: 0.1,
      contrast: 1.4,
      ascii: {
        font: 'Press Start 2P',
        characters: ' .:+*#@0123456789',
        resolution: 5,
        scale: 0.8,
        color: '#00ff00'
      },
      colors: {
        usePalette: false,
        background: '#001100',
        palette: ['#00ff00', '#001100'],
        active: [true, true]
      }
    }
  },

  // Dither Presets
  {
    id: 'dither-gameboy',
    name: 'Game Boy',
    description: 'Classic handheld gaming palette',
    category: 'dither',
    settings: {
      effectType: 'bayer',
      brightness: 0.05,
      contrast: 1.2,
      dither: {
        matrixType: 2,
        scale: 4
      },
      colors: {
        usePalette: true,
        background: '#8bac0f',
        palette: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
        active: [true, true, true, true]
      }
    }
  },
  {
    id: 'dither-vaporwave',
    name: 'Vaporwave',
    description: 'Retro-futuristic aesthetic',
    category: 'dither',
    settings: {
      effectType: 'bayer',
      brightness: 0.1,
      contrast: 1.3,
      dither: {
        matrixType: 1,
        scale: 3
      },
      colors: {
        usePalette: true,
        background: '#ff00ff',
        palette: ['#1a0033', '#ff00ff', '#00ffff', '#ff6ec7', '#ffd700'],
        active: [true, true, true, true, true]
      }
    }
  },
  {
    id: 'dither-synthwave',
    name: 'Synthwave Grid',
    description: 'Retro-futuristic grid patterns with electric colors',
    category: 'dither',
    settings: {
      effectType: 'bayer',
      brightness: 0.15,
      contrast: 1.7,
      dither: {
        matrixType: 1,
        scale: 2
      },
      colors: {
        usePalette: true,
        background: '#000820',
        palette: ['#000820', '#00ffff', '#ff0080', '#ffff00', '#ff4080', '#8000ff'],
        active: [true, true, true, true, true, true]
      }
    }
  },
  {
    id: 'dither-cyberdelic',
    name: 'Cyberdelic',
    description: 'Psychedelic cyber dithering with rainbow neon',
    category: 'dither',
    settings: {
      effectType: 'noise',
      brightness: 0.25,
      contrast: 1.9,
      dither: {
        matrixType: 3,
        scale: 4
      },
      colors: {
        usePalette: true,
        background: '#0f001a',
        palette: ['#0f001a', '#ff6ec7', '#00ff41', '#ff0080', '#00ffff', '#ffff00', '#ff4000'],
        active: [true, true, true, true, true, true, true]
      }
    }
  },
  {
    id: 'dither-newspaper',
    name: 'Newspaper',
    description: 'Classic print media style',
    category: 'dither',
    settings: {
      effectType: 'bayer',
      brightness: 0.15,
      contrast: 1.4,
      dither: {
        matrixType: 3,
        scale: 2
      },
      colors: {
        usePalette: true,
        background: '#ffffff',
        palette: ['#000000', '#404040', '#808080', '#c0c0c0', '#ffffff'],
        active: [true, true, true, true, true]
      }
    }
  },
  {
    id: 'dither-cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon dystopian color scheme',
    category: 'dither',
    settings: {
      effectType: 'noise',
      brightness: -0.1,
      contrast: 1.5,
      dither: {
        matrixType: 2,
        scale: 6
      },
      colors: {
        usePalette: true,
        background: '#000000',
        palette: ['#000000', '#ff0080', '#00ff41', '#0080ff', '#ffff00'],
        active: [true, true, true, true, true]
      }
    }
  },
  {
    id: 'dither-sepia',
    name: 'Vintage Sepia',
    description: 'Old photograph aesthetic',
    category: 'dither',
    settings: {
      effectType: 'bayer',
      brightness: 0.2,
      contrast: 1.1,
      dither: {
        matrixType: 2,
        scale: 5
      },
      colors: {
        usePalette: true,
        background: '#f4f1e8',
        palette: ['#3d2914', '#8b4513', '#cd853f', '#deb887', '#f4f1e8'],
        active: [true, true, true, true, true]
      }
    }
  },
  {
    id: 'dither-arctic',
    name: 'Arctic Blues',
    description: 'Cool blue monochrome palette',
    category: 'dither',
    settings: {
      effectType: 'bayer',
      brightness: 0.1,
      contrast: 1.25,
      dither: {
        matrixType: 1,
        scale: 4
      },
      colors: {
        usePalette: true,
        background: '#f0f9ff',
        palette: ['#0c4a6e', '#0369a1', '#0ea5e9', '#7dd3fc', '#f0f9ff'],
        active: [true, true, true, true, true]
      }
    }
  },

  // Mixed Presets
  {
    id: 'mixed-matrix',
    name: 'Matrix Code',
    description: 'Green terminal aesthetic',
    category: 'mixed',
    settings: {
      effectType: 'ascii',
      brightness: -0.05,
      contrast: 1.8,
      ascii: {
        font: 'Source Code Pro',
        characters: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        resolution: 4,
        scale: 0.75,
        color: '#00ff41',
        colorTrio: ['#003311', '#00ff41', '#66ff66'],
        useColorTrio: true
      },
      colors: {
        usePalette: false,
        background: '#000000',
        palette: ['#00ff41', '#000000'],
        active: [true, true]
      }
    }
  },
  {
    id: 'mixed-blueprint',
    name: 'Blueprint',
    description: 'Technical drawing style',
    category: 'mixed',
    settings: {
      effectType: 'ascii',
      brightness: 0.2,
      contrast: 1.4,
      ascii: {
        font: 'Roboto Mono',
        characters: ' .-+|┌┐└┘├┤┬┴┼═║',
        resolution: 7,
        scale: 0.9,
        color: '#ffffff'
      },
      colors: {
        usePalette: false,
        background: '#1e40af',
        palette: ['#ffffff', '#1e40af'],
        active: [true, true]
      }
    }
  }
];

export function getPresetsByCategory(category) {
  if (!category) return EFFECT_PRESETS;
  return EFFECT_PRESETS.filter(preset => preset.category === category);
}

export function getPresetById(id) {
  return EFFECT_PRESETS.find(preset => preset.id === id);
}
