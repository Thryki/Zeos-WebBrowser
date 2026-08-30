'use strict';

const THEMES = [
  {
    id: 'orca',
    name: 'Orca',
    desc: 'Workspace preto neutro com painéis discretos e acentos verdes.',
    swatches: ['#0b0b0b', '#181818', '#22c55e'],
    appearance: {
      themeId: 'orca',
      background: '#0b0b0b',
      foreground: '#f5f5f5',
      accent: '#22c55e',
      panel: '#181818',
      panelHover: '#242424',
      border: '#2a2a2a',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'elite-pure-black',
    name: 'Elite Pure Black',
    desc: 'Preto puro absoluto com contraste máximo.',
    swatches: ['#000000', '#171717', '#ffffff'],
    appearance: {
      themeId: 'elite-pure-black',
      background: '#000000',
      foreground: '#ffffff',
      accent: '#ffffff',
      panel: '#171717',
      panelHover: '#262626',
      border: '#333333',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'elite-indigo',
    name: 'Elite Indigo',
    desc: 'Preto profundo com painéis índigo e acentos violeta.',
    swatches: ['#0c0c0c', '#1c1c2e', '#7d72ff'],
    appearance: {
      themeId: 'elite-indigo',
      background: '#0c0c0c',
      foreground: '#f1f1f6',
      accent: '#7d72ff',
      panel: '#1c1c2e',
      panelHover: '#282840',
      border: '#2e2e4a',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'dark',
    name: 'Escuro',
    desc: 'Neutro, alto contraste e discreto.',
    swatches: ['#101114', '#2a2d33', '#f3f4f6'],
    appearance: {
      themeId: 'dark',
      background: '#101114',
      foreground: '#f3f4f6',
      accent: '#f3f4f6',
      panel: '#2a2d33',
      panelHover: '#34373e',
      border: '#2a2d33',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'light',
    name: 'Claro',
    desc: 'Superfícies claras para ambientes iluminados.',
    swatches: ['#f6f7fb', '#ffffff', '#18181b'],
    appearance: {
      themeId: 'light',
      background: '#f6f7fb',
      foreground: '#18181b',
      accent: '#18181b',
      panel: '#ffffff',
      panelHover: '#f1f5f9',
      border: '#e6eaf0',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    desc: 'Roxo, ciano e rosa no padrão clássico Dracula.',
    swatches: ['#282a36', '#bd93f9', '#ff79c6'],
    appearance: {
      themeId: 'dracula',
      background: '#282a36',
      foreground: '#f8f8f2',
      accent: '#bd93f9',
      panel: '#343746',
      panelHover: '#44475a',
      border: '#44475a',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    desc: 'Azuis frios e contraste suave.',
    swatches: ['#2e3440', '#88c0d0', '#a3be8c'],
    appearance: {
      themeId: 'nord',
      background: '#2e3440',
      foreground: '#eceff4',
      accent: '#88c0d0',
      panel: '#3b4252',
      panelHover: '#434c5e',
      border: '#4c566a',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    desc: 'Tema quente retrô com tons terrosos.',
    swatches: ['#282828', '#fabd2f', '#b8bb26'],
    appearance: {
      themeId: 'gruvbox',
      background: '#282828',
      foreground: '#ebdbb2',
      accent: '#fabd2f',
      panel: '#3c3836',
      panelHover: '#504945',
      border: '#665c54',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'solarized',
    name: 'Solarized',
    desc: 'Base azul-petróleo e contraste calibrado.',
    swatches: ['#002b36', '#268bd2', '#b58900'],
    appearance: {
      themeId: 'solarized',
      background: '#002b36',
      foreground: '#fdf6e3',
      accent: '#268bd2',
      panel: '#073642',
      panelHover: '#0b3c49',
      border: '#164b59',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    desc: 'Azul escuro moderno com acentos vibrantes.',
    swatches: ['#1a1b26', '#7aa2f7', '#bb9af7'],
    appearance: {
      themeId: 'tokyo-night',
      background: '#1a1b26',
      foreground: '#c0caf5',
      accent: '#7aa2f7',
      panel: '#24283b',
      panelHover: '#292e42',
      border: '#414868',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'vscode',
    name: 'VS Code',
    desc: 'Paleta Dark+ padrão do Visual Studio Code.',
    swatches: ['#1e1e1e', '#007acc', '#cccccc'],
    appearance: {
      themeId: 'vscode',
      background: '#1e1e1e',
      foreground: '#cccccc',
      accent: '#007acc',
      panel: '#252526',
      panelHover: '#2d2d30',
      border: '#333333',
      font: 'Consolas'
    }
  },
  {
    id: 'min-dark',
    name: 'Min Dark',
    desc: 'Paleta minimalista do Min Theme para ambientes escuros.',
    swatches: ['#1f1f1f', '#fafafa', '#888888'],
    appearance: {
      themeId: 'min-dark',
      background: '#1f1f1f',
      foreground: '#fafafa',
      accent: '#fafafa',
      panel: '#2a2a2a',
      panelHover: '#383838',
      border: '#303030',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'min-light',
    name: 'Min Light',
    desc: 'Paleta minimalista do Min Theme para ambientes claros.',
    swatches: ['#ffffff', '#1976D2', '#6f42c1'],
    appearance: {
      themeId: 'min-light',
      background: '#ffffff',
      foreground: '#212121',
      accent: '#1976d2',
      panel: '#f6f6f6',
      panelHover: '#eeeeee',
      border: '#e0e0e0',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'dark-lemon',
    name: 'Dark Lemon',
    desc: 'Quase preto com acento limão e sintaxe Material.',
    swatches: ['#141414', '#ffff50', '#c792ea'],
    appearance: {
      themeId: 'dark-lemon',
      background: '#141414',
      foreground: '#ffffff',
      accent: '#ffff50',
      panel: '#242424',
      panelHover: '#2c2c2c',
      border: '#262626',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'ember',
    name: 'Ember',
    desc: 'Carvão frio, divisores de fio de cabelo e um acento laranja brasa no que está ativo.',
    swatches: ['#0b0d0e', '#232a2f', '#e0873f'],
    appearance: {
      themeId: 'ember',
      background: '#0b0d0e',
      foreground: '#e4e4e7',
      accent: '#e0873f',
      panel: '#20232a',
      panelHover: '#232a2f',
      border: '#2e373e',
      font: 'IBM Plex Mono'
    }
  },
  {
    id: 'golden-premium',
    name: 'Dourado Premium',
    desc: 'Luxuoso marrom escuro e pretos profundos com elegantes detalhes dourados.',
    swatches: ['#1c1815', '#28211c', '#d4af37'],
    appearance: {
      themeId: 'golden-premium',
      background: '#1c1815',
      foreground: '#fef08a',
      accent: '#d4af37',
      panel: '#28211c',
      panelHover: '#332b24',
      border: '#3d3228',
      font: 'IBM Plex Mono'
    }
  }
];

function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === 'orca') || THEMES[0];
}

module.exports = {
  THEMES,
  getTheme
};
