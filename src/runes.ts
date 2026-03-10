export interface RuneDefinition {
  id: string;
  name: string;
  letter: string;
  meaning: string;
  path: string;
}

// All 24 Elder Futhark runes.
// Geometric paths in 80x160 viewBox (8 wide × 16 tall).
// CRITICAL: All stave-based runes have their central stave at x=40
// so they align when overlaid in a bindrune.
// Stave runs from y=8 to y=152. Branches extend left/right from there.

export const RUNE_VIEWBOX = '0 0 80 160';
export const RUNE_WIDTH = 80;
export const RUNE_HEIGHT = 160;

export const RUNES: RuneDefinition[] = [
  {
    // Fehu ᚠ — stave + two branches angling up-right
    id: "fehu", name: "Fehu", letter: "\u16A0", meaning: "Wealth, abundance",
    path: "M 40 8 L 40 152 M 40 8 L 72 36 M 40 44 L 72 72",
  },
  {
    // Uruz ᚢ — stave down, bar across top to right stave, right stave shorter
    id: "uruz", name: "Uruz", letter: "\u16A2", meaning: "Strength, vitality",
    path: "M 40 8 L 40 152 M 40 8 L 72 8 L 72 96 L 40 152",
  },
  {
    // Thurisaz ᚦ — stave + triangle thorn pointing right
    id: "thurisaz", name: "Thurisaz", letter: "\u16A6", meaning: "Protection, defense",
    path: "M 40 8 L 40 152 M 40 32 L 72 64 L 40 96",
  },
  {
    // Ansuz ᚨ — stave + two branches angling down-left
    id: "ansuz", name: "Ansuz", letter: "\u16A8", meaning: "Wisdom, communication",
    path: "M 40 8 L 40 152 M 40 8 L 8 44 M 40 44 L 8 80",
  },
  {
    // Raidho ᚱ — stave + triangular loop top-right + diagonal leg
    id: "raidho", name: "Raidho", letter: "\u16B1", meaning: "Journey, movement",
    path: "M 40 8 L 40 152 M 40 8 L 72 8 L 72 56 L 40 56 M 40 88 L 72 152",
  },
  {
    // Kenaz ᚲ — open angle pointing left (torch) — no stave
    id: "kenaz", name: "Kenaz", letter: "\u16B2", meaning: "Knowledge, creativity",
    path: "M 64 8 L 16 80 L 64 152",
  },
  {
    // Gebo ᚷ — X cross — no stave
    id: "gebo", name: "Gebo", letter: "\u16B7", meaning: "Gift, partnership",
    path: "M 8 24 L 72 136 M 72 24 L 8 136",
  },
  {
    // Wunjo ᚹ — stave + flag at top pointing right
    id: "wunjo", name: "Wunjo", letter: "\u16B9", meaning: "Joy, harmony",
    path: "M 40 8 L 40 152 M 40 8 L 72 8 L 40 56",
  },
  {
    // Hagalaz ᚺ — stave + crossbar connecting to right branch
    id: "hagalaz", name: "Hagalaz", letter: "\u16BA", meaning: "Disruption, change",
    path: "M 40 8 L 40 152 M 40 48 L 72 48 L 72 8 M 40 112 L 72 112 L 72 152",
  },
  {
    // Nauthiz ᚾ — stave + crossing diagonal
    id: "nauthiz", name: "Nauthiz", letter: "\u16BE", meaning: "Need, constraint",
    path: "M 40 8 L 40 152 M 16 112 L 64 48",
  },
  {
    // Isa ᛁ — single vertical line (stave only)
    id: "isa", name: "Isa", letter: "\u16C1", meaning: "Ice, stillness",
    path: "M 40 8 L 40 152",
  },
  {
    // Jera ᛃ — two interlocking angular pieces — no stave
    id: "jera", name: "Jera", letter: "\u16C3", meaning: "Harvest, cycles",
    path: "M 40 8 L 64 8 L 64 44 L 40 80 M 40 80 L 16 116 L 16 152 L 40 152",
  },
  {
    // Eihwaz ᛇ — stave + upper-left + lower-right branches
    id: "eihwaz", name: "Eihwaz", letter: "\u16C7", meaning: "Endurance, reliability",
    path: "M 40 8 L 40 152 M 40 44 L 8 8 M 40 116 L 72 152",
  },
  {
    // Perthro ᛈ — angular cup open right, centered on stave
    id: "perthro", name: "Perthro", letter: "\u16C8", meaning: "Mystery, fate",
    path: "M 40 8 L 72 44 L 72 116 L 40 152",
  },
  {
    // Algiz ᛉ — stave + Y branches at top
    id: "algiz", name: "Algiz", letter: "\u16C9", meaning: "Protection, sanctuary",
    path: "M 40 152 L 40 8 M 40 44 L 8 8 M 40 44 L 72 8",
  },
  {
    // Sowilo ᛊ — angular S / lightning — no stave
    id: "sowilo", name: "Sowilo", letter: "\u16CA", meaning: "Sun, success",
    path: "M 16 8 L 64 8 L 16 80 L 64 80",
  },
  {
    // Tiwaz ᛏ — stave + upward arrow wings
    id: "tiwaz", name: "Tiwaz", letter: "\u16CF", meaning: "Justice, honor",
    path: "M 40 152 L 40 8 M 40 8 L 8 56 M 40 8 L 72 56",
  },
  {
    // Berkano ᛒ — stave + two bumps right
    id: "berkano", name: "Berkano", letter: "\u16D2", meaning: "Growth, renewal",
    path: "M 40 8 L 40 152 M 40 8 L 72 40 L 40 80 M 40 80 L 72 112 L 40 152",
  },
  {
    // Ehwaz ᛖ — two staves connected by diagonal: left stave down, diagonal right-up, right stave down
    id: "ehwaz", name: "Ehwaz", letter: "\u16D6", meaning: "Trust, partnership",
    path: "M 16 152 L 16 8 L 64 80 L 64 152 M 64 8 L 16 80",
  },
  {
    // Mannaz ᛗ — stave + crossed branches to right stave
    id: "mannaz", name: "Mannaz", letter: "\u16D7", meaning: "Humanity, self",
    path: "M 40 8 L 40 152 M 40 8 L 72 8 L 72 152 M 40 8 L 72 80 M 72 8 L 40 80",
  },
  {
    // Laguz ᛚ — stave + single branch angling down-right from top
    id: "laguz", name: "Laguz", letter: "\u16DA", meaning: "Water, intuition",
    path: "M 40 8 L 40 152 M 40 8 L 72 56",
  },
  {
    // Ingwaz ᛜ — diamond — no stave
    id: "ingwaz", name: "Ingwaz", letter: "\u16DC", meaning: "Fertility, potential",
    path: "M 40 16 L 72 80 L 40 144 L 8 80 Z",
  },
  {
    // Dagaz ᛞ — bowtie / hourglass — no stave
    id: "dagaz", name: "Dagaz", letter: "\u16DE", meaning: "Dawn, breakthrough",
    path: "M 8 16 L 72 16 L 8 144 L 72 144 Z",
  },
  {
    // Othala ᛟ — diamond top + two legs splaying down
    id: "othala", name: "Othala", letter: "\u16DF", meaning: "Heritage, legacy",
    path: "M 40 8 L 72 44 L 40 80 L 8 44 Z M 8 44 L 8 152 M 72 44 L 72 152",
  },
];
