export interface RuneDefinition {
  id: string;
  name: string;
  letter: string;
  meaning: string;
  path: string;
}

// All 24 Elder Futhark runes.
// Geometric paths in 80x160 viewBox (8 wide × 16 tall).
// ALL coordinates snapped to 10px grid for clean alignment.
// Central stave at x=40, from y=10 to y=150.
// Branches extend to x=10 (left) or x=70 (right).

export const RUNE_VIEWBOX = '0 0 80 160';
export const RUNE_WIDTH = 80;
export const RUNE_HEIGHT = 160;

export const RUNES: RuneDefinition[] = [
  {
    // Fehu ᚠ — stave + two branches angling up-right
    id: "fehu", name: "Fehu", letter: "\u16A0", meaning: "Wealth, abundance, and prosperity",
    path: "M 40 10 L 40 150 M 40 10 L 70 40 M 40 50 L 70 80",
  },
  {
    // Uruz ᚢ — stave + bar right + right stave + diagonal back
    id: "uruz", name: "Uruz", letter: "\u16A2", meaning: "Raw strength, vitality, and primal power",
    path: "M 40 10 L 40 150 M 40 10 L 70 10 L 70 90 L 40 150",
  },
  {
    // Thurisaz ᚦ — stave + triangle thorn right
    id: "thurisaz", name: "Thurisaz", letter: "\u16A6", meaning: "Thorn of protection, reactive force",
    path: "M 40 10 L 40 150 M 40 30 L 70 60 L 40 90",
  },
  {
    // Ansuz ᚨ — stave + two branches angling down-left
    id: "ansuz", name: "Ansuz", letter: "\u16A8", meaning: "Divine wisdom, speech, and revelation",
    path: "M 40 10 L 40 150 M 40 10 L 10 40 M 40 50 L 10 80",
  },
  {
    // Raidho ᚱ — stave + loop top-right + diagonal leg
    id: "raidho", name: "Raidho", letter: "\u16B1", meaning: "Journey, rhythm, and right action",
    path: "M 40 10 L 40 150 M 40 10 L 70 10 L 70 60 L 40 60 M 40 90 L 70 150",
  },
  {
    // Kenaz ᚲ — open angle pointing left (no stave)
    id: "kenaz", name: "Kenaz", letter: "\u16B2", meaning: "Torch of knowledge, craft, and insight",
    path: "M 60 10 L 20 80 L 60 150",
  },
  {
    // Gebo ᚷ — X cross (no stave)
    id: "gebo", name: "Gebo", letter: "\u16B7", meaning: "Gift, sacred exchange, and balance",
    path: "M 10 30 L 70 130 M 70 30 L 10 130",
  },
  {
    // Wunjo ᚹ — stave + flag at top right
    id: "wunjo", name: "Wunjo", letter: "\u16B9", meaning: "Joy, harmony, and shared wellbeing",
    path: "M 40 10 L 40 150 M 40 10 L 70 10 L 40 60",
  },
  {
    // Hagalaz ᚺ — stave + crossbar to right branch
    id: "hagalaz", name: "Hagalaz", letter: "\u16BA", meaning: "Hail, sudden disruption, and transformation",
    path: "M 40 10 L 40 150 M 40 50 L 70 50 L 70 10 M 40 110 L 70 110 L 70 150",
  },
  {
    // Nauthiz ᚾ — stave + crossing diagonal
    id: "nauthiz", name: "Nauthiz", letter: "\u16BE", meaning: "Need, constraint, and lessons of hardship",
    path: "M 40 10 L 40 150 M 20 110 L 60 50",
  },
  {
    // Isa ᛁ — single vertical line
    id: "isa", name: "Isa", letter: "\u16C1", meaning: "Ice, stillness, and focused patience",
    path: "M 40 10 L 40 150",
  },
  {
    // Jera ᛃ — two interlocking angles (no stave)
    id: "jera", name: "Jera", letter: "\u16C3", meaning: "Harvest, natural cycles, and earned reward",
    path: "M 40 10 L 70 10 L 70 50 L 40 80 M 40 80 L 10 110 L 10 150 L 40 150",
  },
  {
    // Eihwaz ᛇ — stave + upper-left + lower-right branches
    id: "eihwaz", name: "Eihwaz", letter: "\u16C7", meaning: "Yew tree, endurance, and deep resilience",
    path: "M 40 10 L 40 150 M 40 50 L 10 10 M 40 110 L 70 150",
  },
  {
    // Perthro ᛈ — angular cup open right
    id: "perthro", name: "Perthro", letter: "\u16C8", meaning: "Mystery, fate, and the unknown path",
    path: "M 20 10 L 60 50 L 60 110 L 20 150",
  },
  {
    // Algiz ᛉ — stave + Y branches at top
    id: "algiz", name: "Algiz", letter: "\u16C9", meaning: "Elk sedge, divine protection, and sanctuary",
    path: "M 40 150 L 40 10 M 40 50 L 10 10 M 40 50 L 70 10",
  },
  {
    // Sowilo ᛊ — angular S / lightning (no stave)
    id: "sowilo", name: "Sowilo", letter: "\u16CA", meaning: "Sun, vitality, and triumphant clarity",
    path: "M 20 10 L 60 10 L 20 80 L 60 80",
  },
  {
    // Tiwaz ᛏ — stave + upward arrow wings
    id: "tiwaz", name: "Tiwaz", letter: "\u16CF", meaning: "Justice, honor, and sacrificial courage",
    path: "M 40 150 L 40 10 M 40 10 L 10 60 M 40 10 L 70 60",
  },
  {
    // Berkano ᛒ — stave + two bumps right
    id: "berkano", name: "Berkano", letter: "\u16D2", meaning: "Birch, new growth, and nurturing renewal",
    path: "M 40 10 L 40 150 M 40 10 L 70 40 L 40 80 M 40 80 L 70 110 L 40 150",
  },
  {
    // Ehwaz ᛖ — stave + mirrored zigzag (M-shape via central stave)
    id: "ehwaz", name: "Ehwaz", letter: "\u16D6", meaning: "Horse, trust, and harmonious partnership",
    path: "M 40 10 L 40 150 M 40 10 L 10 80 L 40 80 L 70 10 M 70 10 L 70 80",
  },
  {
    // Mannaz ᛗ — stave + M-shape branches from top
    id: "mannaz", name: "Mannaz", letter: "\u16D7", meaning: "Humanity, self-awareness, and shared destiny",
    path: "M 40 10 L 40 150 M 10 10 L 10 80 M 10 10 L 40 50 M 70 10 L 40 50 M 70 10 L 70 80",
  },
  {
    // Laguz ᛚ — stave + single branch from top angling right
    id: "laguz", name: "Laguz", letter: "\u16DA", meaning: "Water, intuition, and the flow of life",
    path: "M 40 10 L 40 150 M 40 10 L 70 60",
  },
  {
    // Ingwaz ᛜ — diamond (no stave)
    id: "ingwaz", name: "Ingwaz", letter: "\u16DC", meaning: "Seed of fertility, inner potential",
    path: "M 40 20 L 70 80 L 40 140 L 10 80 Z",
  },
  {
    // Dagaz ᛞ — bowtie / hourglass (no stave)
    id: "dagaz", name: "Dagaz", letter: "\u16DE", meaning: "Dawn, awakening, and bold breakthrough",
    path: "M 10 20 L 70 20 L 10 140 L 70 140 Z",
  },
  {
    // Othala ᛟ — diamond top + two legs
    id: "othala", name: "Othala", letter: "\u16DF", meaning: "Ancestral heritage, legacy, and homeland",
    path: "M 40 10 L 70 50 L 40 90 L 10 50 Z M 10 50 L 10 150 M 70 50 L 70 150",
  },
];
