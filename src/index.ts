/*
 * TLSH is provided for use under two licenses: Apache OR BSD.
 * Users may opt to use either license depending on the license
 * restictions of the systems with which they plan to integrate
 * the TLSH code.
 */

/* ==============
 * Apache License
 * ==============
 * Copyright 2013 Trend Micro Incorporated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* ===========
 * BSD License
 * ===========
 * Copyright (c) 2013, Trend Micro Incorporated
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.

 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Port of C++ implementation tlsh to typescript.
 *
 * Construct Tlsh object with methods:
 *   update
 *   finale
 *   fromTlshStr
 *   reset
 *   hash
 *   totalDiff
 *
 */

const debug: boolean = false;

// From tlsh_util.cpp
const vTable: Uint8Array = new Uint8Array([
  1, 87, 49, 12, 176, 178, 102, 166, 121, 193, 6, 84, 249, 230, 44, 163, 14,
  197, 213, 181, 161, 85, 218, 80, 64, 239, 24, 226, 236, 142, 38, 200, 110,
  177, 104, 103, 141, 253, 255, 50, 77, 101, 81, 18, 45, 96, 31, 222, 25, 107,
  190, 70, 86, 237, 240, 34, 72, 242, 20, 214, 244, 227, 149, 235, 97, 234, 57,
  22, 60, 250, 82, 175, 208, 5, 127, 199, 111, 62, 135, 248, 174, 169, 211, 58,
  66, 154, 106, 195, 245, 171, 17, 187, 182, 179, 0, 243, 132, 56, 148, 75, 128,
  133, 158, 100, 130, 126, 91, 13, 153, 246, 216, 219, 119, 68, 223, 78, 83, 88,
  201, 99, 122, 11, 92, 32, 136, 114, 52, 10, 138, 30, 48, 183, 156, 35, 61, 26,
  143, 74, 251, 94, 129, 162, 63, 152, 170, 7, 115, 167, 241, 206, 3, 150, 55,
  59, 151, 220, 90, 53, 23, 131, 125, 173, 15, 238, 79, 95, 89, 16, 105, 137,
  225, 224, 217, 160, 37, 123, 118, 73, 2, 157, 46, 116, 9, 145, 134, 228, 207,
  212, 202, 215, 69, 229, 27, 188, 67, 124, 168, 252, 42, 4, 29, 108, 21, 247,
  19, 205, 39, 203, 233, 40, 186, 147, 198, 192, 155, 33, 164, 191, 98, 204,
  165, 180, 117, 76, 140, 36, 210, 172, 41, 54, 159, 8, 185, 232, 113, 196, 231,
  47, 146, 120, 51, 65, 28, 144, 254, 221, 93, 189, 194, 139, 112, 43, 71, 109,
  184, 209,
]);

function bMapping(salt: number, i: number, j: number, k: number): number {
  let h: number = 0;

  h = vTable[h ^ salt];
  h = vTable[h ^ i];
  h = vTable[h ^ j];
  h = vTable[h ^ k];
  return h;
}

const LOG_1_5: number = 0.4054651;
const LOG_1_3: number = 0.26236426;
const LOG_1_1: number = 0.09531018;

function lCapturing(len: number): number {
  let i: number;
  if (len <= 656) {
    i = Math.floor(Math.log(len) / LOG_1_5);
  } else if (len <= 3199) {
    i = Math.floor(Math.log(len) / LOG_1_3 - 8.72777);
  } else {
    i = Math.floor(Math.log(len) / LOG_1_1 - 62.5472);
  }

  return i % 255;
}

function swapByte(i: number): number {
  let byte: number = 0;
  byte = ((i & 0xf0) >> 4) & 0x0f;
  byte |= ((i & 0x0f) << 4) & 0xf0;
  return byte;
}

function toHex(data: Uint8Array, len: number): string {
  let s: string = "";
  for (let i = 0; i < len; i++) {
    if (data[i] < 16) {
      s = s.concat("0");
    }
    debug && console.log("toHex: " + data[i]);
    s = s.concat(data[i].toString(16).toUpperCase());
  }

  return s;
}

function fromHex(str: string): Uint8Array {
  const ret: Uint8Array = new Uint8Array(str.length / 2); // unsigned char array
  for (let i = 0; i < str.length; i += 2) {
    ret[i / 2] = parseInt(str.substring(i, i + 2), 16);
  }
  return ret;
}

function modDiff(x: number, y: number, R: number): number {
  let dl: number = 0;
  let dr: number = 0;
  if (y > x) {
    dl = y - x;
    dr = x + R - y;
  } else {
    dl = x - y;
    dr = y + R - x;
  }
  return dl > dr ? dr : dl;
}

function generateTable(): number[][] {
  const arraySize: number = 256;
  const result: number[][] = new Array(arraySize);
  for (let i = 0; i < result.length; i++) {
    result[i] = new Array(arraySize).fill(0);
  }

  for (let i = 0; i < arraySize; i++) {
    for (let j = 0; j < arraySize; j++) {
      let x: number = i,
        y: number = j,
        d: number,
        diff: number = 0;
      d = Math.abs((x % 4) - (y % 4));
      diff += d == 3 ? 6 : d;
      x = Math.floor(x / 4);
      y = Math.floor(y / 4);

      d = Math.abs((x % 4) - (y % 4));
      diff += d == 3 ? 6 : d;
      x = Math.floor(x / 4);
      y = Math.floor(y / 4);

      d = Math.abs((x % 4) - (y % 4));
      diff += d == 3 ? 6 : d;
      x = Math.floor(x / 4);
      y = Math.floor(y / 4);

      d = Math.abs((x % 4) - (y % 4));
      diff += d == 3 ? 6 : d;
      result[i][j] = diff;
    }
  }
  return result;
}

const bitPairsDiffTable: number[][] = generateTable();

function hDistance(len: number, x: Uint8Array, y: Uint8Array): number {
  let diff: number = 0;
  for (let i = 0; i < len; i++) {
    debug &&
      console.log(
        "bitPairsDiffTable[" +
          x[i] +
          "][" +
          y[i] +
          "]=" +
          bitPairsDiffTable[x[i]][y[i]],
      );
    diff += bitPairsDiffTable[x[i]][y[i]];
  }
  debug && console.log("hDistance returning " + diff);
  return diff;
}

const SLIDING_WND_SIZE: number = 5;
const RNG_SIZE: number = SLIDING_WND_SIZE;

function RNG_IDX(i: number): number {
  return (i + RNG_SIZE) % RNG_SIZE;
}

const TLSH_CHECKSUM_LEN: number = 1;
const BUCKETS: number = 256;
const EFF_BUCKETS: number = 128;
const CODE_SIZE: number = 32; // 128 * 2 bits = 32 bytes
const TLSH_STRING_LEN: number = 70; // 2 + 1 + 32 bytes = 70 hexidecimal chars
const RANGE_LVALUE: number = 256;
const RANGE_QRATIO: number = 16;

interface Quartiles {
  q1: number;
  q2: number;
  q3: number;
}

interface TlshBuffer {
  bucket_copy: Uint32Array;
}

function SWAP_UINT(buf: TlshBuffer, x: number, y: number): void {
  const int_tmp: number = buf.bucket_copy[x];
  buf.bucket_copy[x] = buf.bucket_copy[y];
  buf.bucket_copy[y] = int_tmp;
}

function partition(buf: TlshBuffer, left: number, right: number): number {
  if (left == right) {
    return left;
  }
  if (left + 1 == right) {
    if (buf.bucket_copy[left] > buf.bucket_copy[right]) {
      SWAP_UINT(buf, left, right);
    }
    return left;
  }

  let ret: number = left;
  const pivot: number = (left + right) >> 1;

  const val: number = buf.bucket_copy[pivot];

  buf.bucket_copy[pivot] = buf.bucket_copy[right];
  buf.bucket_copy[right] = val;

  for (let i = left; i < right; i++) {
    if (buf.bucket_copy[i] < val) {
      SWAP_UINT(buf, ret, i);
      ret++;
    }
  }
  buf.bucket_copy[right] = buf.bucket_copy[ret];
  buf.bucket_copy[ret] = val;

  return ret;
}

function findQuartile(tlsh: TLSH, quartiles: Quartiles): void {
  const buf: TlshBuffer = {
    bucket_copy: new Uint32Array(EFF_BUCKETS),
  };
  const short_cut_left: Uint32Array = new Uint32Array(EFF_BUCKETS);
  const short_cut_right: Uint32Array = new Uint32Array(EFF_BUCKETS);
  let spl: number = 0;
  let spr: number = 0;
  const p1: number = EFF_BUCKETS / 4 - 1;
  const p2: number = EFF_BUCKETS / 2 - 1;
  const p3: number = EFF_BUCKETS - EFF_BUCKETS / 4 - 1;
  const end: number = EFF_BUCKETS - 1;

  for (let i = 0; i <= end; i++) {
    buf.bucket_copy[i] = tlsh.aBucket[i];
  }

  for (let l = 0, r = end; ; ) {
    const ret: number = partition(buf, l, r);
    if (ret > p2) {
      r = ret - 1;
      short_cut_right[spr] = ret;
      spr++;
    } else if (ret < p2) {
      l = ret + 1;
      short_cut_left[spl] = ret;
      spl++;
    } else {
      quartiles.q2 = buf.bucket_copy[p2];
      break;
    }
  }

  short_cut_left[spl] = p2 - 1;
  short_cut_right[spr] = p2 + 1;

  for (let i = 0, l = 0; i <= spl; i++) {
    let r: number = short_cut_left[i];
    if (r > p1) {
      for (;;) {
        const ret: number = partition(buf, l, r);
        if (ret > p1) {
          r = ret - 1;
        } else if (ret < p1) {
          l = ret + 1;
        } else {
          quartiles.q1 = buf.bucket_copy[p1];
          break;
        }
      }
      break;
    } else if (r < p1) {
      l = r;
    } else {
      quartiles.q1 = buf.bucket_copy[p1];
      break;
    }
  }

  for (let i = 0, r = end; i <= spr; i++) {
    let l: number = short_cut_right[i];
    if (l < p3) {
      for (;;) {
        const ret: number = partition(buf, l, r);
        if (ret > p3) {
          r = ret - 1;
        } else if (ret < p3) {
          l = ret + 1;
        } else {
          quartiles.q3 = buf.bucket_copy[p3];
          break;
        }
      }
      break;
    } else if (l > p3) {
      r = l;
    } else {
      quartiles.q3 = buf.bucket_copy[p3];
      break;
    }
  }
}

class TLSH {
  checksum: Uint8Array; // unsigned char array
  slideWindow: Uint8Array;
  aBucket: Uint32Array; // unsigned int array
  dataLength: number;
  tmpCode: Uint8Array;
  Lvalue: number;
  Q: number;
  lshCode: string;
  lshCodeValid: boolean;

  constructor() {
    this.checksum = new Uint8Array(TLSH_CHECKSUM_LEN); // unsigned char array
    this.slideWindow = new Uint8Array(SLIDING_WND_SIZE);
    this.aBucket = new Uint32Array(BUCKETS); // unsigned int array
    this.dataLength = 0;
    this.tmpCode = new Uint8Array(CODE_SIZE);
    this.Lvalue = 0;
    this.Q = 0;
    this.lshCode = "";
    this.lshCodeValid = false;
  }

  getQLo(Q: number): number {
    return Q & 0x0f;
  }

  getQHi(Q: number): number {
    return (Q & 0xf0) >> 4;
  }

  setQLo(Q: number, x: number): number {
    return (Q & 0xf0) | (x & 0x0f);
  }

  setQHi(Q: number, x: number): number {
    return (Q & 0x0f) | ((x & 0x0f) << 4);
  }

  update(data: Uint8Array, length?: number): void {
    length = typeof length !== "undefined" ? length : data.length;

    let j = this.dataLength % RNG_SIZE;
    let fed_len = this.dataLength;

    for (let i = 0; i < length; i++, fed_len++, j = RNG_IDX(j + 1)) {
      this.slideWindow[j] = data[i];
      debug && console.log("slideWindow[" + j + "]=" + this.slideWindow[j]);

      if (fed_len >= 4) {
        //only calculate when input >= 5 bytes
        const j_1 = RNG_IDX(j - 1);
        const j_2 = RNG_IDX(j - 2);
        const j_3 = RNG_IDX(j - 3);
        const j_4 = RNG_IDX(j - 4);

        for (let k = 0; k < TLSH_CHECKSUM_LEN; k++) {
          if (k == 0) {
            this.checksum[k] = bMapping(
              0,
              this.slideWindow[j],
              this.slideWindow[j_1],
              this.checksum[k],
            );
            debug &&
              console.log("tlsh.checksum[" + k + "]=" + this.checksum[k]);
          } else {
            this.checksum[k] = bMapping(
              this.checksum[k - 1],
              this.slideWindow[j],
              this.slideWindow[j_1],
              this.checksum[k],
            );
          }
        }

        let r: number;
        r = bMapping(
          2,
          this.slideWindow[j],
          this.slideWindow[j_1],
          this.slideWindow[j_2],
        );
        this.aBucket[r]++;
        r = bMapping(
          3,
          this.slideWindow[j],
          this.slideWindow[j_1],
          this.slideWindow[j_3],
        );
        this.aBucket[r]++;
        r = bMapping(
          5,
          this.slideWindow[j],
          this.slideWindow[j_2],
          this.slideWindow[j_3],
        );
        this.aBucket[r]++;
        r = bMapping(
          7,
          this.slideWindow[j],
          this.slideWindow[j_2],
          this.slideWindow[j_4],
        );
        this.aBucket[r]++;
        r = bMapping(
          11,
          this.slideWindow[j],
          this.slideWindow[j_1],
          this.slideWindow[j_4],
        );
        this.aBucket[r]++;
        r = bMapping(
          13,
          this.slideWindow[j],
          this.slideWindow[j_3],
          this.slideWindow[j_4],
        );
        this.aBucket[r]++;
      }
    }
    this.dataLength += length;
  }

  // final is a reserved word
  finale(data?: Uint8Array, length?: number): void {
    if (typeof data !== "undefined") {
      this.update(data, length);
    }

    // incoming data must more than or equal to 512 bytes
    if (this.dataLength < 256) {
      console.error("ERROR: length too small - " + this.dataLength); //  + ")");
      return;
    }

    const quartiles: Quartiles = {
      q1: 0,
      q2: 0,
      q3: 0,
    };
    findQuartile(this, quartiles);

    // buckets must be more than 50% non-zero
    let nonzero: number = 0;
    for (let i = 0; i < CODE_SIZE; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.aBucket[4 * i + j] > 0) {
          nonzero++;
        }
      }
    }
    if (nonzero <= (4 * CODE_SIZE) / 2) {
      console.error(
        "ERROR: not enought variation in input - " +
          nonzero +
          " < " +
          (4 * CODE_SIZE) / 2,
      );
      return;
    }

    for (let i = 0; i < CODE_SIZE; i++) {
      let h: number = 0;
      for (let j = 0; j < 4; j++) {
        const k: number = this.aBucket[4 * i + j];
        if (quartiles.q3 < k) {
          h += 3 << (j * 2); // leave the optimization j*2 = j<<1 or j*2 = j+j for compiler
        } else if (quartiles.q2 < k) {
          h += 2 << (j * 2);
        } else if (quartiles.q1 < k) {
          h += 1 << (j * 2);
        }
      }
      this.tmpCode[i] = h;
    }

    this.Lvalue = lCapturing(this.dataLength);
    this.Q = this.setQLo(this.Q, ((quartiles.q1 * 100) / quartiles.q3) % 16);
    this.Q = this.setQHi(this.Q, ((quartiles.q2 * 100) / quartiles.q3) % 16);
    this.lshCodeValid = true;
  }

  hash(): string {
    if (this.lshCodeValid == false) {
      return "ERROR IN PROCESSING";
    }

    const tmp: {
      checksum: Uint8Array;
      Lvalue: number;
      Q: number;
      tmpCode: Uint8Array;
    } = {
      checksum: new Uint8Array(TLSH_CHECKSUM_LEN),
      Lvalue: 0,
      Q: 0,
      tmpCode: new Uint8Array(CODE_SIZE),
    };

    for (let k = 0; k < TLSH_CHECKSUM_LEN; k++) {
      tmp.checksum[k] = swapByte(this.checksum[k]);
      debug &&
        console.log(
          "After swapByte for checksum: tmp.checksum:" +
            tmp.checksum[k] +
            ", tlsh.checksum:" +
            this.checksum[k],
        );
    }
    tmp.Lvalue = swapByte(this.Lvalue);

    tmp.Q = swapByte(this.Q);

    debug &&
      console.log(
        "After swapByte for Q: tmp.Q:" + tmp.Q + ", tlsh.Q:" + this.Q,
      );
    for (let i = 0; i < CODE_SIZE; i++) {
      tmp.tmpCode[i] = this.tmpCode[CODE_SIZE - 1 - i];
      debug && console.log("tmp.tmpCode[" + i + "]:" + tmp.tmpCode[i]);
    }

    this.lshCode = toHex(tmp.checksum, TLSH_CHECKSUM_LEN);

    const tmpArray: Uint8Array = new Uint8Array(1);
    tmpArray[0] = tmp.Lvalue;
    this.lshCode = this.lshCode.concat(toHex(tmpArray, 1));

    tmpArray[0] = tmp.Q;
    this.lshCode = this.lshCode.concat(toHex(tmpArray, 1));
    this.lshCode = this.lshCode.concat(toHex(tmp.tmpCode, CODE_SIZE));
    return this.lshCode;
  }

  reset(): void {
    this.checksum = new Uint8Array(TLSH_CHECKSUM_LEN);
    this.slideWindow = new Uint8Array(SLIDING_WND_SIZE);
    this.aBucket = new Uint32Array(BUCKETS);
    this.dataLength = 0;
    this.tmpCode = new Uint8Array(CODE_SIZE);
    this.Lvalue = 0;
    this.Q = 0;
    this.lshCode = "";
    this.lshCodeValid = false;
  }

  // len_diff defaults to true
  totalDiff(other: TLSH, len_diff?: boolean): number {
    if (this === other) {
      return 0;
    }

    len_diff = typeof len_diff !== "undefined" ? len_diff : true;
    let diff: number = 0;

    if (len_diff) {
      const ldiff: number = modDiff(this.Lvalue, other.Lvalue, RANGE_LVALUE);
      if (ldiff == 0) diff = 0;
      else if (ldiff == 1) diff = 1;
      else diff += ldiff * 12;
    }

    const q1diff: number = modDiff(
      this.getQLo(this.Q),
      this.getQLo(other.Q),
      RANGE_QRATIO,
    );
    if (q1diff <= 1) diff += q1diff;
    else diff += (q1diff - 1) * 12;

    const q2diff: number = modDiff(
      this.getQHi(this.Q),
      this.getQHi(other.Q),
      RANGE_QRATIO,
    );
    if (q2diff <= 1) diff += q2diff;
    else diff += (q2diff - 1) * 12;

    for (let k = 0; k < TLSH_CHECKSUM_LEN; k++) {
      if (this.checksum[k] != other.checksum[k]) {
        diff++;
        break;
      }
    }

    diff += hDistance(CODE_SIZE, this.tmpCode, other.tmpCode);

    return diff;
  }

  fromTlshStr(str: string): void {
    if (str.length != TLSH_STRING_LEN) {
      console.error(
        "TLSH.fromTlshStr() - string has wrong length (" +
          str.length +
          " != " +
          TLSH_STRING_LEN +
          ")",
      );
      return;
    }
    for (let i = 0; i < TLSH_STRING_LEN; i++) {
      if (
        !(
          (str[i] >= "0" && str[i] <= "9") ||
          (str[i] >= "A" && str[i] <= "F") ||
          (str[i] >= "a" && str[i] <= "f")
        )
      ) {
        console.error(
          "TLSH.fromTlshStr() - string has invalid (non-hex) characters",
        );
        return;
      }
    }

    const tmp: Uint8Array = fromHex(str);
    // Order of assignment is based on order of fields in lsh_bin
    // Also note that TLSH_CHECKSUM_LEN is 1
    let i: number = 0;
    this.checksum[i] = swapByte(tmp[i++]);
    this.Lvalue = swapByte(tmp[i++]);
    this.Q = swapByte(tmp[i++]);

    for (let j = 0; j < CODE_SIZE; j++) {
      this.tmpCode[j] = tmp[i + CODE_SIZE - 1 - j];
    }
    this.lshCodeValid = true;
  }
}

export default TLSH;
