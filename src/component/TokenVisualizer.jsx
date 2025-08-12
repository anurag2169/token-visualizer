import { useState } from "react";
import "./styles.css";

export default function TokenVisualizer({ tokenizer }) {
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState([]);
  const [charLen, setCharLen] = useState(0);

  const handleChange = (e) => {
    const text = e.target.value;
    setInput(text);
    setCharLen(text.length);

    if (tokenizer && tokenizer.encode) {
      const ids = tokenizer.encode(text);
      setTokens(ids);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-100 min-h-screen my-8 rounded-xl">
      <h1 className="text-4xl font-bold text-slate-700 tracking-tight">
        Token Visualizer
      </h1>
      <div className="space-y-4">
        <textarea
          placeholder="Enter text to tokenize..."
          value={input}
          onChange={handleChange}
          className="w-full h-32 p-6 border-2 border-slate-200 rounded-xl resize-none font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-slate-700 shadow-sm transition-all duration-200"
        />
      </div>

      <div className="text-lg font-semibold text-slate-600 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        Tokens : {tokens.length} Character : {charLen}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-32">
        <div className="flex flex-wrap gap-3">
          {tokens.map((tokenId, idx) => {
            let decodedValue = "";
            if (tokenizer?.decode) {
              decodedValue = tokenizer.decode([tokenId]);
            } else if (tokenizer?.idToToken) {
              decodedValue = tokenizer.idToToken[tokenId] || "";
            }

            return (
              <span
                key={idx}
                className={`px-4 py-3 rounded-lg text-sm font-semibold border-2 shadow-sm transition-all duration-200 hover:shadow-md token-${
                  idx % 10
                }`}
              >
                {tokenId} : {decodedValue}
              </span>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-700">Token IDs</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <code className="text-slate-600 font-mono text-lg">
            {JSON.stringify(tokens)}
          </code>
        </div>
      </div>
    </div>
  );
}
