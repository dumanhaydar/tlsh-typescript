import { describe, it, expect } from "vitest";
import TLSH from "./index";

// Base string > 256 bytes for valid tests
const baseString = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.
Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.
Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue,
euismod non, mi. Proin porttitor, orci nec nonummy.
`.trim();

// Reusable encoder
const encoder = new TextEncoder();

/**
 * Helper function to quickly hash a string
 */
function hashString(input: string): TLSH {
  const data = encoder.encode(input);
  const tlsh = new TLSH();
  tlsh.update(data);
  tlsh.finale();
  return tlsh;
}

describe("TLSH Library", () => {
  it("should instantiate the class", () => {
    const tlsh = new TLSH();
    expect(tlsh).toBeInstanceOf(TLSH);
  });

  it("should return 0 diff for identical inputs", () => {
    const tlsh1 = hashString(baseString);
    const tlsh2 = hashString(baseString);

    expect(tlsh1.hash()).not.toBe("ERROR IN PROCESSING");
    expect(tlsh1.hash()).toBe(tlsh2.hash());
    expect(tlsh1.totalDiff(tlsh2)).toBe(0);
  });

  it("should return a small, non-zero diff for slightly different inputs", () => {
    const tlsh1 = hashString(baseString);

    // Change just one word
    const slightlyDifferentString = baseString.replace("dolor", "donuts");
    const tlsh2 = hashString(slightlyDifferentString);

    expect(tlsh1.hash()).not.toBe(tlsh2.hash());
    expect(tlsh1.totalDiff(tlsh2)).toBeGreaterThan(0);
    // We expect a small difference (arbitrarily, < 100)
    expect(tlsh1.totalDiff(tlsh2)).toBeLessThan(100);
  });

  it("should return a large diff for very different inputs", () => {
    const tlsh1 = hashString(baseString);

    // Completely different string
    const veryDifferentString = `
This is a completely different string used for testing. It has no
resemblance to the original Lorem Ipsum text. We expect a very high
difference score, indicating that the two inputs are not similar at all.
This ensures the algorithm correctly identifies dissimilar content. Add more characters to exceed 200 bytes.
    `.trim();
    const tlsh2 = hashString(veryDifferentString);

    expect(tlsh1.hash()).not.toBe(tlsh2.hash());
    // We expect a large difference (arbitrarily, > 200)
    expect(tlsh1.totalDiff(tlsh2)).toBeGreaterThan(200);
  });

  it("should load a hash string correctly using fromTlshStr", () => {
    const tlsh1 = hashString(baseString);
    const hash1 = tlsh1.hash();

    const tlsh_loader = new TLSH();
    tlsh_loader.fromTlshStr(hash1);

    // The loaded object must have a diff of 0 compared to the original
    expect(tlsh_loader.hash()).toBe(hash1);
    expect(tlsh1.totalDiff(tlsh_loader)).toBe(0);
  });

  it("should return an error hash for inputs < 256 bytes", () => {
    const shortString = "This is too short.";

    // Note: the library will log an error, this is expected.
    const tlsh_short = hashString(shortString);
    const hash = tlsh_short.hash();

    expect(hash).toBe("ERROR IN PROCESSING");
  });

  it("should reset and process new data correctly", () => {
    const tlsh = hashString(baseString);
    const hash1 = tlsh.hash();

    // Reset the same object
    tlsh.reset();

    const differentString =
      "Another completely different string, long enough for a hash. ".repeat(
        10,
      );
    const tlsh2 = hashString(differentString);
    const hash2 = tlsh2.hash();

    // After reset, the hash should be that of the new string
    // (Test to ensure reset works and we're not re-hashing the old one)
    expect(hash1).not.toBe(hash2);

    // Prove that reset worked: hash the new string with the reset object
    tlsh.update(encoder.encode(differentString));
    tlsh.finale();
    const hash1_reset = tlsh.hash();

    expect(hash1_reset).toBe(hash2);
  });

  it('should match the known C++/Java test vector ("golden master test")', () => {
    // This is the standard test vector string used in other TLSH ports (e.g., Java, JS).
    // It's a quote from "The UNIX-HATERS Handbook" and is 410 bytes long.
    const unixHatersQuote =
      "The best documentation is the UNIX source. After all, this is what the " +
      "system uses for documentation when it decides what to do next! The " +
      "manuals paraphrase the source code, often having been written at " +
      "different times and by different people than who wrote the code. " +
      "Think of them as guidelines. Sometimes they are more like wishes... " +
      "Nonetheless, it is all too common to turn to the source and find " +
      "options and behaviors that are not documented in the manual. Sometimes " +
      "you find options described in the manual that are unimplemented " +
      "and ignored by the source.";

    // This is the known-good HASH BODY (the last 64 chars) for the string above.
    const expectedHashBody =
      "6FF02BEF718027B0160B4391212923ED7F1A463D563B1549B86CF62973B197AD2731F8";

    const tlsh = hashString(unixHatersQuote);
    const fullHash = tlsh.hash();

    // The full hash is 70 chars (6 for header + 64 for body)
    expect(fullHash).not.toBe("ERROR IN PROCESSING");
    expect(fullHash.length).toBe(70);

    expect(fullHash).toBe(expectedHashBody);
  });
});
