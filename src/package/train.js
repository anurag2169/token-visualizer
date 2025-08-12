import { BPETokenizer } from "./tokenization.js";
import { corpus } from "./corpus.js";

const tok = new BPETokenizer();
tok.train(corpus, 1000);
tok.save("vocab.json", "merges.json");

tok.loadWithFsModule();
