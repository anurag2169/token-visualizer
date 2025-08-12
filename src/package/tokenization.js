import fs from "fs";
import path from "path";

export class BPETokenizer {
  constructor({ unkToken = "<unk>" } = {}) {
    this.unkToken = unkToken;
    this.vocab = {}; // token -> id
    this.idToToken = {}; // id -> token
    this.merges = []; // ["a b", ...] in merge order
    this.mergesRank = new Map(); // "a b" -> rank (lower = higher priority)
  }

  // ---- TRAIN ----
  train(corpus, vocabSize = 1000) {
    // Build initial token lists per word: each word -> ['▁', 'h','e','l','l','o'] style
    const tokensList = [];
    for (const sentence of corpus) {
      const words = sentence.split(/\s+/).filter(Boolean);
      for (const w of words) {
        tokensList.push(`▁${w}`.split("")); // leading underline marks word boundary
      }
    }

    // initial unique symbols (characters including the '▁' marker)
    const initialSymbols = new Set();
    for (const t of tokensList) for (const ch of t) initialSymbols.add(ch);

    // Work on a copy of tokensList (we will mutate it)
    let working = tokensList.map((t) => [...t]);
    const merges = [];

    // Repeatedly find most frequent pair and merge it until target vocab reached
    while (initialSymbols.size + merges.length < vocabSize) {
      // Count all adjacent pairs across working
      const pairCounts = new Map();
      for (const tokens of working) {
        for (let i = 0; i < tokens.length - 1; i++) {
          const pair = `${tokens[i]} ${tokens[i + 1]}`;
          pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
        }
      }

      if (pairCounts.size === 0) break;

      // Find best pair (highest count)
      let bestPair = null;
      let bestCount = -1;
      for (const [pair, cnt] of pairCounts.entries()) {
        if (cnt > bestCount) {
          bestCount = cnt;
          bestPair = pair;
        }
      }

      if (!bestPair) break;

      // If the best pair occurs only once you can still merge,
      // but often for small corpora it's fine. We merge anyway.
      merges.push(bestPair);

      // Apply the merge to every token sequence
      const [a, b] = bestPair.split(" ");
      working = working.map((tokens) => {
        const merged = [];
        for (let i = 0; i < tokens.length; i++) {
          if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
            merged.push(a + b);
            i++;
          } else {
            merged.push(tokens[i]);
          }
        }
        return merged;
      });
    }

    const vocab = {};
    let id = 0;
    vocab[this.unkToken] = id++; // <unk> -> 0

    const initialArray = Array.from(initialSymbols).sort();
    for (const sym of initialArray) {
      if (!(sym in vocab)) vocab[sym] = id++;
    }

    for (const m of merges) {
      const mergedSymbol = m.replace(" ", "");
      if (!(mergedSymbol in vocab)) vocab[mergedSymbol] = id++;
    }

    // In case some merged tokens still appear in working but weren't added (edge),
    // ensure all remaining tokens are added
    const finalSymbols = new Set();
    for (const tokens of working) for (const s of tokens) finalSymbols.add(s);
    for (const s of finalSymbols) {
      if (!(s in vocab)) vocab[s] = id++;
    }

    // Save to instance
    this.vocab = vocab;
    this.idToToken = Object.fromEntries(
      Object.entries(vocab).map(([t, i]) => [i, t])
    );
    this.merges = merges;
    this.mergesRank = new Map(merges.map((m, idx) => [m, idx]));
  }

  // SAVE
  save(vocabPath = "vocab.json", mergesPath = "merges.json") {
    const publicDir = path.join(process.cwd(), "public");
    fs.writeFileSync(
      path.join(publicDir, vocabPath),
      JSON.stringify(this.vocab, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(publicDir, mergesPath),
      JSON.stringify(this.merges, null, 2),
      "utf8"
    );
  }

  // Load in Node js with fs module
  loadWithFsModule(
    vocabPath = "public/vocab.json",
    mergesPath = "public/merges.json"
  ) {
    this.vocab = JSON.parse(fs.readFileSync(vocabPath, "utf8"));
    // rebuild idToToken
    this.idToToken = Object.fromEntries(
      Object.entries(this.vocab).map(([t, i]) => [i, t])
    );
    this.merges = JSON.parse(fs.readFileSync(mergesPath, "utf8"));
    this.mergesRank = new Map(this.merges.map((m, idx) => [m, idx]));
    if (!(this.unkToken in this.vocab)) {
      // ensure unk exists
      const maxId = Math.max(
        ...Object.values(this.vocab).map((n) => Number(n))
      );
      this.vocab[this.unkToken] = maxId + 1;
      this.idToToken[this.vocab[this.unkToken]] = this.unkToken;
    }
    console.log(
      `Loaded vocab (${Object.keys(this.vocab).length}) and merges (${
        this.merges.length
      })`
    );
  }

  // LOAD in browser
  async load(vocabUrl = "/vocab.json", mergesUrl = "/merges.json") {
    // Fetch vocab
    const vocabResponse = await fetch(vocabUrl);
    this.vocab = await vocabResponse.json();

    // Build idToToken
    this.idToToken = Object.fromEntries(
      Object.entries(this.vocab).map(([t, i]) => [i, t])
    );

    // Fetch merges
    const mergesResponse = await fetch(mergesUrl);
    this.merges = await mergesResponse.json();
    this.mergesRank = new Map(this.merges.map((m, idx) => [m, idx]));

    // Ensure unk exists
    if (!(this.unkToken in this.vocab)) {
      const maxId = Math.max(...Object.values(this.vocab).map(Number));
      this.vocab[this.unkToken] = maxId + 1;
      this.idToToken[this.vocab[this.unkToken]] = this.unkToken;
    }
  }

  // ---- ENCODE single word tokens using merges order ----
  _bpeEncodeToken(tokenArray) {
    // tokenArray is an array of characters, e.g. ['▁','h','e','l','l','o']
    const mergesRank = this.mergesRank;
    // quick path: if no merges present, just return joined chars
    if (!mergesRank || mergesRank.size === 0) {
      return tokenArray;
    }

    const tokens = tokenArray.slice();

    while (true) {
      // find the pair with minimal rank (highest priority merge) among adjacent pairs
      let minRank = Infinity;
      let minIndex = -1;
      for (let i = 0; i < tokens.length - 1; i++) {
        const pair = `${tokens[i]} ${tokens[i + 1]}`;
        if (mergesRank.has(pair)) {
          const r = mergesRank.get(pair);
          if (r < minRank) {
            minRank = r;
            minIndex = i;
          }
        }
      }
      if (minIndex === -1) break; // no mergeable pairs left

      // merge the chosen pair at minIndex
      const merged = tokens[minIndex] + tokens[minIndex + 1];
      tokens.splice(minIndex, 2, merged);
    }

    return tokens;
  }

  // ---- PUBLIC ENCODE: text -> array of token ids ----
  encode(text) {
    const out = [];
    // split into words (simple approach) and add leading marker
    const words = text.split(/\s+/).filter(Boolean);
    for (const w of words) {
      const chars = `▁${w}`.split(""); // leading marker
      const pieces = this._bpeEncodeToken(chars); // array of tokens for this word
      for (const p of pieces) {
        const id = this.vocab[p] ?? this.vocab[this.unkToken] ?? 0;
        out.push(id);
      }
    }
    return out;
  }

  // ---- PUBLIC DECODE: array of ids -> text string ----
  decode(ids) {
    const pieces = ids.map((id) => this.idToToken[id] ?? this.unkToken);
    const joined = pieces.join("");
    // replace marker with space and trim leading space
    const text = joined.replace(/▁/g, " ").trimStart();
    return text;
  }
}
