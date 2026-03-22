export interface RuneDefinition {
  id: string;
  name: string;
  letter: string;
  meaning: string;
}

// All 24 Elder Futhark runes.
// Rendered via Noto Sans Runic font (Unicode block U+16A0–U+16FF).

export const RUNE_VIEWBOX = '0 0 80 160';
export const RUNE_WIDTH = 80;
export const RUNE_HEIGHT = 160;

export const RUNES: RuneDefinition[] = [
  { id: "fehu", name: "Fehu", letter: "\u16A0", meaning: "Wealth, abundance, and prosperity" },
  { id: "uruz", name: "Uruz", letter: "\u16A2", meaning: "Raw strength, vitality, and primal power" },
  { id: "thurisaz", name: "Thurisaz", letter: "\u16A6", meaning: "Thorn of protection, reactive force" },
  { id: "ansuz", name: "Ansuz", letter: "\u16A8", meaning: "Divine wisdom, speech, and revelation" },
  { id: "raidho", name: "Raidho", letter: "\u16B1", meaning: "Journey, rhythm, and right action" },
  { id: "kenaz", name: "Kenaz", letter: "\u16B2", meaning: "Torch of knowledge, craft, and insight" },
  { id: "gebo", name: "Gebo", letter: "\u16B7", meaning: "Gift, sacred exchange, and balance" },
  { id: "wunjo", name: "Wunjo", letter: "\u16B9", meaning: "Joy, harmony, and shared wellbeing" },
  { id: "hagalaz", name: "Hagalaz", letter: "\u16BA", meaning: "Hail, sudden disruption, and transformation" },
  { id: "nauthiz", name: "Nauthiz", letter: "\u16BE", meaning: "Need, constraint, and lessons of hardship" },
  { id: "isa", name: "Isa", letter: "\u16C1", meaning: "Ice, stillness, and focused patience" },
  { id: "jera", name: "Jera", letter: "\u16C3", meaning: "Harvest, natural cycles, and earned reward" },
  { id: "eihwaz", name: "Eihwaz", letter: "\u16C7", meaning: "Yew tree, endurance, and deep resilience" },
  { id: "perthro", name: "Perthro", letter: "\u16C8", meaning: "Mystery, fate, and the unknown path" },
  { id: "algiz", name: "Algiz", letter: "\u16C9", meaning: "Elk sedge, divine protection, and sanctuary" },
  { id: "sowilo", name: "Sowilo", letter: "\u16CA", meaning: "Sun, vitality, and triumphant clarity" },
  { id: "tiwaz", name: "Tiwaz", letter: "\u16CF", meaning: "Justice, honor, and sacrificial courage" },
  { id: "berkano", name: "Berkano", letter: "\u16D2", meaning: "Birch, new growth, and nurturing renewal" },
  { id: "ehwaz", name: "Ehwaz", letter: "\u16D6", meaning: "Horse, trust, and harmonious partnership" },
  { id: "mannaz", name: "Mannaz", letter: "\u16D7", meaning: "Humanity, self-awareness, and shared destiny" },
  { id: "laguz", name: "Laguz", letter: "\u16DA", meaning: "Water, intuition, and the flow of life" },
  { id: "ingwaz", name: "Ingwaz", letter: "\u16DC", meaning: "Seed of fertility, inner potential" },
  { id: "dagaz", name: "Dagaz", letter: "\u16DE", meaning: "Dawn, awakening, and bold breakthrough" },
  { id: "othala", name: "Othala", letter: "\u16DF", meaning: "Ancestral heritage, legacy, and homeland" },
];
