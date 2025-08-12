# Token Visualizer

A simple React component to visualize token IDs and their decoded values using a Byte Pair Encoding (BPE) tokenizer.

- Demo Url : [text](https://anuragdev-phi.vercel.app/)

---

![Sample Image 1](/demo-1.png)
![Sample Image 2](/demo-2.png)

## Features

- Input any text and see the tokenizer output as token IDs.
- View each token ID along with its decoded string value.
- Tokens are color-coded with pastel modern colors for easy distinction.
- Live update as you type.

---

## Installation & Setup

1. Clone or download the repo.

2. Install dependencies:

```bash
npm install
```

3. Run development server:

```bash
npm run dev
```

4. Train the tokenizer (generates vocab and merges files):

```bash
npm run train
```

### Note: Training reads your corpus file and generates the tokenizer vocabulary and merges which are used during encoding and decoding.

## Corpus Details

- The corpus is a collection of sentences or phrases used to train the tokenizer.
- During training, the corpus is tokenized to build a vocabulary of subword units and their merges using Byte Pair Encoding (BPE).
- A well-rounded corpus with diverse vocabulary helps the tokenizer learn meaningful tokens and better encode new input text.
- You can add or customize the corpus in your training script or data file. Example sentences include everyday phrases, programming-related texts, and punctuation marks.
- The tokenizer uses the trained vocabulary and merges files generated from this corpus to encode and decode text efficiently.
- The corpus can be expanded for better tokenization quality.

## Created by Anurag Dubey

## Portfolio : https://anuragdev-phi.vercel.app/
