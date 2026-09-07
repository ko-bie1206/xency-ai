const PALETTE = ["#2554C7", "#5B8DEF", "#7C6FEA", "#3FA7B3", "#4C86FF", "#6E5ADB"];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
