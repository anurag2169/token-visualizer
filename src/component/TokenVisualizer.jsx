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
    <div className="container">
      <h2>Token Visualizer</h2>
      <textarea
        placeholder="Enter some text..."
        value={input}
        onChange={handleChange}
      />

      <div className="stat">
        <h3 className="token-num">Tokens : {tokens.length}</h3>
        <h3 className="char-num">Character : {charLen}</h3>
      </div>

      <div className="tokens">
        {tokens.map((tokenId, idx) => {
          let decodedValue = "";
          if (tokenizer?.decode) {
            decodedValue = tokenizer.decode([tokenId]);
          } else if (tokenizer?.idToToken) {
            decodedValue = tokenizer.idToToken[tokenId] || "";
          }

          return (
            <span key={idx} className={`token token-${idx % 10}`}>
              <strong>{tokenId}</strong>
              {" : "}
              <em>{decodedValue}</em>
            </span>
          );
        })}
      </div>
      <div className="token-ids-container">
        <h3>Token IDs</h3>
        <pre className="token-ids">{JSON.stringify(tokens)}</pre>
      </div>
    </div>
  );
}
