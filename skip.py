#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Brute-force decryption for the Skip/Jump cipher (dCode-style).

- Spaces and line breaks are removed; all other characters (including '?') are kept.
- For each skip s in [start_skip, max_skip], initial position = s (wrapped to 1..N).
- By default, only coprime skip sizes (gcd(s, N) == 1) are attempted (matches dCode’s behavior).
  Use --include-noncoprime to also try others (may not cover all positions).
- Results are written to CSV.

Refs:
- dCode Skip Cipher (algorithm & decryption mapping). 
"""

import argparse
import csv
import math
import re
import sys
from pathlib import Path

def normalize_text(raw: str) -> str:
    """
    Remove whitespace (spaces, tabs, newlines). Keep everything else (including '?').
    """
    return ''.join(ch for ch in raw if not ch.isspace())

def skip_decrypt(cipher: str, skip: int, start_pos_1idx: int) -> str | None:
    """
    dCode-style decryption:
      plaintext[pos] = ciphertext[i], where pos = (start + i*skip) mod N
    start_pos_1idx is 1-indexed; convert to 0-index internally.

    Returns the plaintext string if all positions are filled exactly once.
    If the walk revisits a position early (non-coprime case), returns None.
    """
    N = len(cipher)
    if N == 0:
        return ""

    # 1-indexed -> 0-indexed start
    start0 = (start_pos_1idx - 1) % N
    plain = [''] * N
    seen = set()

    pos = start0
    for i, ch in enumerate(cipher):
        if pos in seen:
            # We revisited before placing N chars => gcd(skip, N) != 1; cannot reconstruct fully from one cycle.
            return None
        plain[pos] = ch
        seen.add(pos)
        pos = (pos + skip) % N

    # All positions filled?
    if len(seen) != N:
        return None

    return ''.join(plain)

def main():
    parser = argparse.ArgumentParser(
        description="Bruteforce Skip/Jump cipher decryption (dCode-compatible)."
    )
    src = parser.add_mutually_exclusive_group()
    src.add_argument("--text", help="Ciphertext as a CLI string.")
    src.add_argument("--infile", type=Path, help="Path to file containing ciphertext.")
    parser.add_argument("--start-skip", type=int, default=1, help="First skip size (inclusive).")
    parser.add_argument("--max-skip", type=int, default=None, help="Last skip size (inclusive).")
    parser.add_argument("--outfile", type=Path, default=Path("skip_bruteforce_results.csv"),
                        help="Output CSV path.")
    parser.add_argument("--include-noncoprime", action="store_true",
                        help="Also try skip values with gcd(skip, N) != 1 (often yields incomplete/None).")
    parser.add_argument("--keep-punct", action="store_true",
                        help="(Default) Keep punctuation. Provided for parity; currently always kept.")
    args = parser.parse_args()

    # 1) Load raw input
    if args.text is not None:
        raw = args.text
    elif args.infile is not None:
        raw = args.infile.read_text(encoding="utf-8", errors="replace")
    else:
        # Read from STDIN if piped, else prompt
        if sys.stdin.isatty():
            print("Paste your ciphertext. Ctrl-D (Unix) / Ctrl-Z+Enter (Windows) to end:", file=sys.stderr)
        raw = sys.stdin.read()

    # 2) Normalize: strip only whitespace; keep '?' and other punctuation
    cipher = normalize_text(raw)
    N = len(cipher)
    if N == 0:
        print("No characters after whitespace removal. Nothing to do.", file=sys.stderr)
        sys.exit(1)

    # 3) Determine skip range
    start_skip = max(1, args.start_skip)
    max_skip = args.max_skip if args.max_skip is not None else max(1, N - 1)
    if max_skip < start_skip:
        print("max-skip must be >= start-skip", file=sys.stderr)
        sys.exit(1)

    # 4) Brute force and write CSV
    args.outfile.parent.mkdir(parents=True, exist_ok=True)
    with args.outfile.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["skip", "start_pos(1-indexed)", "length", "coprime", "decrypted_or_empty"])

        for s in range(start_skip, max_skip + 1):
            # Start position equals skip (wrapped to 1..N)
            start_pos_1idx = ((s - 1) % N) + 1
            copr = (math.gcd(s, N) == 1)
            if not copr and not args.include_noncoprime:
                continue

            plaintext = skip_decrypt(cipher, s, start_pos_1idx)

            # For non-coprime cases, plaintext may be None (cycle doesn't cover all positions)
            # We still write a row so you can see which skips were attempted.
            writer.writerow([
                s,
                start_pos_1idx,
                N,
                "Y" if copr else "N",
                plaintext if plaintext is not None else ""
            ])

    print(f"Wrote results to {args.outfile} (N={N}, skips {start_skip}..{max_skip})")

if __name__ == "__main__":
    main()
