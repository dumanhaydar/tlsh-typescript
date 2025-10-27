# tlsh-typescript

A browser-friendly TypeScript implementation of the TLSH (Trend Locality Sensitive Hash) algorithm.

This library allows you to generate TLSH fuzzy hashes and compute the similarity distance between files, blobs, or strings directly in the browser.

## Installation
### Via npm (for Bundlers)

If you are using a bundler like Vite, Webpack, or Rollup:

```bash
npm install tlsh-typescript
```

### Via Browser <script> Tag

You can also use the library directly from a CDN like JSDelivr. It exposes a global TLSH variable.

```HTML
<script src="https://cdn.jsdelivr.net/npm/tlsh-typescript@latest/dist/index.global.js"></script>
```

## Usage and Examples

The `update()` method requires a `Uint8Array`. You must convert your source data (Strings, Files, Blobs) into this format before processing.

### Module Usage (ESM / CJS)

```javascript
// ES Module (Vite, Webpack)
import TLSH from 'tlsh-typescript';

// CommonJS (Legacy Node.js)
const TLSH = require('tlsh-typescript');
```

### Browser (Global)

If you use the `<script>` tag, the class is available on the `window` object.

```javascript
const tlsh = new TLSH();
console.log(tlsh); // Tlsh { ... }
```

## Examples

### 1\. Hashing a String

Use a `TextEncoder` to convert a JavaScript string into a `Uint8Array`.

```javascript
const myString = "The quick brown fox jumps over the lazy dog. This is a test string for TLSH.";

// 1. Convert string to Uint8Array
const data = new TextEncoder().encode(myString);

// 2. Create an instance and process the data
const tlsh = new TLSH();
tlsh.update(data);
tlsh.finale();

// 3. Get the hash
const hash = tlsh.hash();
console.log(hash);
// Example output: T1005E0...
```

### 2\. Hashing a File or Blob (Async)

`File` (from an `<input>`) and `Blob` objects are read asynchronously using `.arrayBuffer()`.

```javascript
/**
 * This async function works for both File and Blob objects.
 */
async function hashFileOrBlob(fileOrBlob) {
  try {
    // 1. Get the ArrayBuffer
    const buffer = await fileOrBlob.arrayBuffer();

    // 2. Convert to Uint8Array
    const data = new Uint8Array(buffer);

    // 3. Process with TLSH
    const tlsh = new TLSH();
    tlsh.update(data);
    tlsh.finale();

    const hash = tlsh.hash();
    console.log(`TLSH Hash: ${hash}`);
    return hash;

  } catch (err) {
    console.error("Error hashing file:", err);
  }
}

// --- Example with a File (e.g., from <input type="file">) ---
/*
const myFileInput = document.querySelector("#my-file-input");
myFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    hashFileOrBlob(file);
  }
});
*/

// --- Example with a Blob ---
const myBlob = new Blob(
  ["This is some content for my blob."],
  { type: 'text/plain' }
);

hashFileOrBlob(myBlob);
```

### 3\. Calculating Similarity (`totalDiff`)

The `totalDiff()` method compares two *finalized* TLSH objects. A lower score means the inputs are more similar.

  * **0** = Identical (or very, very similar)
  * **1000+** = Very different

<!-- end list -->

```javascript
// --- Create the first hash ---
const text1 = "This is the original text. It is very important.";
const data1 = new TextEncoder().encode(text1);

const tlsh1 = new TLSH();
tlsh1.update(data1);
tlsh1.finale();
console.log(`Hash 1: ${tlsh1.hash()}`);


// --- Create the second hash from slightly different text ---
const text2 = "This is the original text. It is very important!!!";
const data2 = new TextEncoder().encode(text2);

const tlsh2 = new TLSH();
tlsh2.update(data2);
tlsh2.finale();
console.log(`Hash 2: ${tlsh2.hash()}`);


// --- Compare the two hashes ---
const diff = tlsh1.totalDiff(tlsh2);
console.log(`Difference score: ${diff}`); // Will be a low number

// --- Compare against a completely different hash ---
const tlsh3 = new TLSH();
// Load a known different hash string
tlsh3.fromTlshStr("T100220158104430218820E04000840A340318A190011400C110C104104008404A049840480C0440050810444120C1C4C94C018A4904C94C018A4904C94C018A4904C");

const diff_large = tlsh1.totalDiff(tlsh3);
console.log(`Large difference score: ${diff_large}`); // Will be a high number
```

## API

  - `new TLSH()`: Creates a new TLSH instance.
  - `update(data: Uint8Array)`: Feeds data to the hash. Can be called multiple times.
  - `finale()`: Finalizes the hash calculation. Must be called after `update()` and before `hash()`.
  - `hash(): string`: Returns the 70-character TLSH hash string (or "ERROR IN PROCESSING").
  - `reset()`: Resets the instance to its initial state to hash new data.
  - `fromTlshStr(hash: string)`: Loads a pre-calculated hash string into the object for comparison.
  - `totalDiff(other: TLSH, len_diff: boolean = true): number`: Calculates the difference score against another finalized `TLSH` object. Set `len_diff` to `false` to ignore length differences in the comparison.

## License

This project is made available under a dual **Apache-2.0 OR BSD-3-Clause** license.

See the `LICENSE` and `NOTICE` files for full details.
