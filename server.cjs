var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_mammoth = __toESM(require("mammoth"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/parse-document", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      let extractedText = "";
      if (req.file.originalname.endsWith(".docx") || req.file.originalname.endsWith(".doc") || req.file.mimetype.includes("word")) {
        const result = await import_mammoth.default.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value;
      } else {
        extractedText = req.file.buffer.toString("utf-8");
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          warning: "GEMINI_API_KEY not configured, falling back",
          textSample: extractedText.substring(0, 500)
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const prompt = `
B\u1EA1n l\xE0 chuy\xEAn gia b\xF3c t\xE1ch d\u1EEF li\u1EC7u c\xE2u h\u1ECFi tr\u1EAFc nghi\u1EC7m t\u1EEB t\xE0i li\u1EC7u.
Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0 \u0111\u1ECDc to\xE0n b\u1ED9 \u0111o\u1EA1n v\u0103n b\u1EA3n sau v\xE0 tr\xEDch xu\u1EA5t t\u1EA5t c\u1EA3 c\xE1c c\xE2u h\u1ECFi tr\u1EAFc nghi\u1EC7m th\xE0nh danh s\xE1ch \u0111\u1ECBnh d\u1EA1ng JSON chu\u1EA9n.

M\u1ED7i c\xE2u h\u1ECFi ph\u1EA3i ch\u1EE9a c\xE1c th\xF4ng tin sau:
- "content": N\u1ED9i dung \u0111\u1EA7y \u0111\u1EE7 c\u1EE7a c\xE2u h\u1ECFi (VD: "Th\u1EDDi h\u1EA1n t\u1ED5 ch\u1EE9c l\u1EC5 k\u1EBFt n\u1EA1p \u0111\u1EA3ng vi\xEAn theo Quy \u0111\u1ECBnh 20-Q\u0110/TW l\xE0 bao l\xE2u?")
- "options": M\u1EA3ng 4 \u0111\xE1p \xE1n d\u1EA1ng ["A. N\u1ED9i dung A", "B. N\u1ED9i dung B", "C. N\u1ED9i dung C", "D. N\u1ED9i dung D"]
- "correctAnswer": K\xFD t\u1EF1 \u0111\xE1p \xE1n \u0111\xFAng ("A", "B", "C", ho\u1EB7c "D")
- "explanation": L\u1EDDi gi\u1EA3i th\xEDch ng\u1EAFn g\u1ECDn (n\u1EBFu c\xF3 trong \u0111\u1EC1 ho\u1EB7c t\u1EF1 t\xF3m t\u1EAFt ng\u1EAFn)

V\u0103n b\u1EA3n \u0111\u1EA7u v\xE0o:
---
${extractedText.substring(0, 15e3)}
---

Ch\u1EC9 tr\u1EA3 v\u1EC1 duy nh\u1EA5t chu\u1ED7i JSON c\xF3 c\u1EA5u tr\xFAc:
{
  "questions": [
    {
      "content": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "C",
      "explanation": "..."
    }
  ]
}
`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } catch (err) {
      console.error("Error parsing document with Gemini:", err);
      return res.status(500).json({
        error: "Failed to process document",
        details: err?.message || String(err)
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
