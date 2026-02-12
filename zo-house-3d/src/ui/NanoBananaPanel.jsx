import { useState } from "react";
import { generateImage, generateTexture, isConfigured } from "../services/nanoBanana";

export default function NanoBananaPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) {
    return (
      <button
        style={{
          position: "absolute",
          top: "120px",
          left: "20px",
          zIndex: 1000,
          background: "linear-gradient(45deg, #FFD700, #FFA500)",
          border: "2px solid #fff",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          cursor: "pointer",
          boxShadow: "0 0 15px rgba(255, 215, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
        }}
        onClick={() => setIsOpen(true)}
        title="Open Nano Banana (Gemini)"
      >
        🍌
      </button>
    );
  }

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateImage(prompt);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "120px",
        left: "20px",
        zIndex: 1000,
        background: "rgba(20, 20, 30, 0.95)",
        border: "1px solid #FFD700",
        borderRadius: "12px",
        padding: "20px",
        width: "300px",
        color: "#fff",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#FFD700", display: "flex", alignItems: "center", gap: "8px" }}>
           🍌 Nano Banana
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "16px" }}
        >
          ✕
        </button>
      </div>

      {!isConfigured() && (
        <div style={{ padding: "10px", background: "rgba(255,0,0,0.1)", border: "1px solid #f00", borderRadius: "6px", marginBottom: "15px", fontSize: "12px" }}>
          ⚠️ Missing API Key. Add <code>VITE_GOOGLE_GENAI_KEY</code> to .env
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a texture or image..."
        style={{
          width: "100%",
          height: "80px",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid #444",
          borderRadius: "6px",
          color: "#fff",
          padding: "8px",
          marginBottom: "10px",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt || !isConfigured()}
          style={{
            flex: 1,
            padding: "8px",
            background: loading ? "#555" : "#FFD700",
            color: loading ? "#aaa" : "#000",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "wait" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        <button
          onClick={() => setPrompt("Seamless cyberpunk concrete floor texture, top down")}
          style={{
            padding: "8px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid #444",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#ccc",
          }}
          title="Use example prompt"
        >
          🎲
        </button>
      </div>

      {error && (
        <div style={{ color: "#ff6b6b", fontSize: "12px", marginBottom: "10px" }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "5px", fontSize: "12px", color: "#888" }}>Result:</div>
          {/* Attempt to display if it's an image URL/Base64, otherwise text dump */}
          {result.startsWith("http") || result.startsWith("data:image") ? (
             <img src={result} alt="Generated" style={{ maxWidth: "100%", borderRadius: "6px", border: "1px solid #444" }} />
          ) : (
             <pre style={{ textAlign: "left", background: "#000", padding: "10px", borderRadius: "6px", overflow: "auto", maxHeight: "150px", fontSize: "10px" }}>
               {result.substring(0, 500) + (result.length > 500 ? "..." : "")}
             </pre>
          )}
        </div>
      )}
    </div>
  );
}
