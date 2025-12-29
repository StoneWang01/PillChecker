
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MedicationInfo, AppLanguage } from "../types";

const languagePrompts = {
  'en': "Response must be in English.",
  'zh-TW': "回應必須使用繁體中文（台灣習慣用詞，如稱呼藥片而非藥錠）。",
  'zh-CN': "响应必须使用简体中文。"
};

export const identifyMedication = async (base64Image: string, lang: AppLanguage): Promise<MedicationInfo> => {
  // 核心檢查：優先讀取注入的 Key，如果沒有則提示
  const apiKey = "key";
  
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "YOUR_API_KEY") {
    console.error("Critical: API_KEY is missing.");
    throw new Error("授權金鑰(API_KEY)缺失：請確認打包工具的環境變數設定。");
  }

  // 每次調用都重新實例化，確保安全性
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Task: Identify the medication.
    Instructions: Provide name, dosage, frequency, purpose, and precautions.
    Language: ${languagePrompts[lang]}
    Return JSON format only.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.includes(",") ? base64Image.split(",")[1] : base64Image,
    },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            dosage: { type: Type.STRING },
            frequency: { type: Type.STRING },
            purpose: { type: Type.STRING },
            precautions: { type: Type.STRING },
          },
          required: ["name", "dosage", "frequency", "purpose", "precautions"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    const errorStr = String(error).toUpperCase();
    
    // 解決 ChatGPT 提到的 WebView 網路攔截問題
    if (errorStr.includes("FAILED TO FETCH") || errorStr.includes("NETWORK_ERROR")) {
      throw new Error("網路連線失敗：請確認手機已開啟網路。如果是 APK，請確認打包工具已開啟「Allow Cross-Origin」與「Internet」權限。");
    } else if (errorStr.includes("403")) {
      throw new Error("API 存取受限：請檢查 Google Cloud 是否限制了 API 金鑰的使用來源。");
    } else {
      throw new Error(error.message || "辨識失敗，請確保藥盒文字清晰後重試。");
    }
  }
};
