import "./App.css";
import { BPETokenizer } from "./package/tokenization";
import TokenVisualizer from "./component/TokenVisualizer";
import { useEffect } from "react";

function App() {
  const tokenizer = new BPETokenizer();
  useEffect(() => {
    tokenizer.load("/vocab.json", "/merges.json");
  }, []);

  return (
    <>
      <TokenVisualizer tokenizer={tokenizer} />
    </>
  );
}

export default App;
