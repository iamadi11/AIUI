/** Fast deterministic non-cryptographic hash (cache keys / stable ids). Works in browser + Node. */
export function hashString(input: string): string {
  let h1 = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
  }
  let h2 = 5381 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h2 = (Math.imul(h2, 33) ^ input.charCodeAt(i)) >>> 0;
  }
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  return (a + b).slice(0, 16);
}
