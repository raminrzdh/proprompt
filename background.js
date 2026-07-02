// Import prompt templates
importScripts("prompt_templates.js");

// Default extension settings
const DEFAULT_SETTINGS = {
  apiProvider: "groq", // "groq", "openai", "gemini", "free"
  groqApiKey: "",
  openaiApiKey: "",
  geminiApiKey: "",
  groqModel: "llama-3.3-70b-versatile",
  openaiModel: "gpt-4o-mini",
  geminiModel: "gemini-2.5-flash",
  defaultTemplate: "general",
  autoDetect: true,
  floatingButton: true,
  uiLanguage: "en",
  savedPrompts: [],
  history: []
};

// Ensure settings exist on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (result) => {
    const updatedSettings = {};
    for (const key in DEFAULT_SETTINGS) {
      if (result[key] === undefined) {
        updatedSettings[key] = DEFAULT_SETTINGS[key];
      }
    }
    if (Object.keys(updatedSettings).length > 0) {
      chrome.storage.local.set(updatedSettings);
    }
  });
});

// Listener for messages from Content Scripts and Popup Dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "optimizePrompt") {
    handleOptimizePrompt(request.payload)
      .then((response) => sendResponse({ success: true, data: response }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for asynchronous response
  }
});

/**
 * Core handler for prompt optimization requests
 */
async function handleOptimizePrompt({ prompt, templateId, lang }) {
  // Fetch latest settings from storage
  const settings = await new Promise((resolve) => {
    chrome.storage.local.get(null, resolve);
  });

  const apiProvider = settings.apiProvider || "groq";
  const uiLanguage = settings.uiLanguage || "en";
  const activeTemplateId = templateId || settings.defaultTemplate || "general";
  const template = self.PROMPT_TEMPLATES[activeTemplateId] || self.PROMPT_TEMPLATES.general;

  // Determine language if not explicitly provided
  const resolvedLang = lang || detectLanguage(prompt);

  // Adapt system prompt for prompts (skip translation instructions if English, adapt if Arabic, adjust explanation language based on uiLanguage)
  const systemPrompt = getAdaptedSystemPrompt(template, resolvedLang, uiLanguage);

  let result;
  if (apiProvider === "groq") {
    // Automatically migrate decommissioned models to supported ones
    let model = settings.groqModel || "llama-3.3-70b-versatile";
    if (model === "llama-3.3-70b-specdec" || model === "llama-3.1-70b-versatile" || model === "llama3-8b-8192") {
      model = "llama-3.3-70b-versatile";
      chrome.storage.local.set({ groqModel: model });
    }

    result = await callLLM(
      "https://api.groq.com/openai/v1/chat/completions",
      settings.groqApiKey,
      model,
      systemPrompt,
      prompt,
      resolvedLang
    );
  } else if (apiProvider === "openai") {
    result = await callLLM(
      "https://api.openai.com/v1/chat/completions",
      settings.openaiApiKey,
      settings.openaiModel || "gpt-4o-mini",
      systemPrompt,
      prompt,
      resolvedLang
    );
  } else if (apiProvider === "gemini") {
    result = await callGemini(
      settings.geminiApiKey,
      settings.geminiModel || "gemini-2.5-flash",
      systemPrompt,
      prompt,
      resolvedLang
    );
  } else {
    // Free Translation fallback
    result = await callFreeTranslator(prompt, template, resolvedLang, uiLanguage);
  }

  // Log optimization in history (max 30 entries)
  if (result && result.optimized) {
    const historyItem = {
      id: "hist_" + Date.now(),
      timestamp: new Date().toISOString(),
      original: prompt,
      translation: result.translation,
      optimized: result.optimized,
      explanation: result.explanation || (
        uiLanguage === "fa" ? "استفاده از بهینه‌ساز پیش‌فرض رایگان" : "Free prompt optimizer fallback"
      ),
      template: activeTemplateId
    };

    const currentHistory = settings.history || [];
    const updatedHistory = [historyItem, ...currentHistory].slice(0, 30);
    chrome.storage.local.set({ history: updatedHistory });
  }

  return result;
}

/**
 * Check and detect text language (fa: Persian, ar: Arabic, en: English)
 */
function detectLanguage(text) {
  if (!text) return "en";
  const arabicPersianRegex = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const matches = text.match(arabicPersianRegex);
  const scriptCount = matches ? matches.length : 0;
  const totalLetters = text.replace(/\s/g, "").length;
  if (totalLetters === 0) return "en";
  
  if ((scriptCount / totalLetters) > 0.15 && scriptCount >= 3) {
    // Check for Persian-specific characters (Peh, Cheh, Gaf, Zheh, Farsi Yeh, Keheh)
    const persianSpecificRegex = /[\u067E\u0686\u06AF\u0698\u06CC\u06A9]/;
    return persianSpecificRegex.test(text) ? "fa" : "ar";
  }
  return "en";
}

/**
 * Dynamically modifies a template's system prompt if the input is English or Arabic and configures explanation output language
 */
function getAdaptedSystemPrompt(template, lang, uiLanguage) {
  let sysPrompt = template.systemPrompt;
  
  // 1. Adapt target translation language instruction
  if (lang === "ar") {
    sysPrompt = sysPrompt
      .replaceAll("Persian (Farsi)", "Arabic")
      .replaceAll("Persian prompt", "Arabic prompt")
      .replaceAll("Persian", "Arabic")
      .replaceAll("in Persian", "in Arabic");
  } else if (lang === "en") {
    sysPrompt = sysPrompt
      .replace("The user will provide a prompt in Persian (Farsi).", "The user will provide a prompt in English.")
      .replace("1. Translate the Persian prompt to natural, professional, high-quality English.", "1. Since the prompt is already in English, skip translation and output it exactly as the translation field.")
      .replace("Translate the Persian prompt to professional technical English.", "Since the prompt is already in English, skip translation and output it exactly as the translation field.")
      .replace("Translate the Persian prompt into rich, natural English.", "Since the prompt is already in English, skip translation and output it exactly as the translation field.")
      .replace("Translate the Persian prompt to English.", "Since the prompt is already in English, skip translation and output it exactly as the translation field.")
      .replace("Straightforward English translation of the original prompt.", "The original English prompt.")
      .replace("Technical English translation of the original prompt.", "The original English prompt.")
      .replace("Natural English translation of the original prompt.", "The original English prompt.")
      .replace("English translation of the original analytical prompt.", "The original English prompt.");
  }

  // 2. Adjust output explanation language depending on the user's extension UI language settings
  if (uiLanguage === "en") {
    sysPrompt = sysPrompt
      .replaceAll("in Persian", "in English")
      .replaceAll("in Arabic", "in English");
  }

  return sysPrompt;
}

/**
 * API call to OpenAI-compatible endpoints (Groq and OpenAI)
 */
async function callLLM(url, apiKey, model, systemPrompt, userPrompt, lang) {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key is missing. Please set your API key in the extension settings.");
  }

  let promptMessage;
  if (lang === "fa") {
    promptMessage = `Optimize this Persian prompt:\n\n${userPrompt}`;
  } else if (lang === "ar") {
    promptMessage = `Optimize this Arabic prompt:\n\n${userPrompt}`;
  } else {
    promptMessage = `Optimize this English prompt:\n\n${userPrompt}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptMessage }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorDetails = await response.text().catch(() => "");
    throw new Error(`API Error (${response.status}): ${errorDetails || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response received from LLM API.");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("LLM response could not be parsed as JSON: " + content);
  }
}

/**
 * API call to Google Gemini API
 */
async function callGemini(apiKey, model, systemPrompt, userPrompt, lang) {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key is missing. Please set your Google Gemini API key in the extension settings.");
  }

  let promptMessage;
  if (lang === "fa") {
    promptMessage = `Optimize this Persian prompt:\n\n${userPrompt}`;
  } else if (lang === "ar") {
    promptMessage = `Optimize this Arabic prompt:\n\n${userPrompt}`;
  } else {
    promptMessage = `Optimize this English prompt:\n\n${userPrompt}`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: promptMessage }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemPrompt }
        ]
      },
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorDetails = await response.text().catch(() => "");
    throw new Error(`Gemini API Error (${response.status}): ${errorDetails || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Empty response received from Google Gemini API.");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Gemini response could not be parsed as JSON: " + content);
  }
}

/**
 * Free translation fallback using MyMemory API
 */
async function callFreeTranslator(prompt, template, lang, uiLanguage) {
  if (lang === "en") {
    // If it's English, bypass API translation entirely and structure directly
    let optimized = "";
    if (template.id === "coding") {
      optimized = `[Role]: Expert Software Developer
[Objective]: ${prompt}
[Requirements]:
- Provide clean, robust, and commented code.
- Handle edge-cases and explain key architectural details.
- Avoid deprecated features.`;
    } else if (template.id === "writing") {
      optimized = `[Role]: Professional Copywriter and Editor
[Task]: ${prompt}
[Guidelines]:
- Use clear structure, engaging tone, and clear headings.
- Ensure natural phrasing and grammatical correctness.`;
    } else if (template.id === "analysis") {
      optimized = `[Role]: Senior Analytical Thinker & Scientist
[Goal]: ${prompt}
[Approach]:
- Think step-by-step (Chain of Thought).
- Present final results with structured markdown tables or bullet points where appropriate.`;
    } else {
      optimized = `[Role]: Expert AI Assistant
[Goal/Prompt]: ${prompt}
[Instructions]:
- Break down complex topics step-by-step.
- Be concise but detailed, avoiding fluff.
- Format the response with proper markdown headings and code blocks where applicable.`;
    }

    return {
      translation: prompt,
      optimized: optimized,
      explanation: uiLanguage === "fa"
        ? "بهینه‌ساز رایگان برای انگلیسی (بدون نیاز به ترجمه)"
        : "Free prompt optimizer for English (no translation needed)"
    };
  }

  try {
    const langPair = lang === "fa" ? "fa|en" : "ar|en";
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(prompt)}&langpair=${langPair}`
    );
    if (!response.ok) {
      throw new Error(`Translation API status: ${response.status}`);
    }
    const data = await response.json();
    const translation = data.responseData?.translatedText || "";

    if (!translation) {
      throw new Error("Translation failed to return text.");
    }

    let optimized = "";
    if (template.id === "coding") {
      optimized = `[Role]: Expert Software Developer
[Objective]: ${translation}
[Requirements]:
- Provide clean, robust, and commented code.
- Handle edge-cases and explain key architectural details.
- Avoid deprecated features.`;
    } else if (template.id === "writing") {
      optimized = `[Role]: Professional Copywriter and Editor
[Task]: ${translation}
[Guidelines]:
- Use clear structure, engaging tone, and clear headings.
- Ensure natural phrasing and grammatical correctness.`;
    } else if (template.id === "analysis") {
      optimized = `[Role]: Senior Analytical Thinker & Scientist
[Goal]: ${translation}
[Approach]:
- Think step-by-step (Chain of Thought).
- Present final results with structured markdown tables or bullet points where appropriate.`;
    } else {
      optimized = `[Role]: Expert AI Assistant
[Goal/Prompt]: ${translation}
[Instructions]:
- Break down complex topics step-by-step.
- Be concise but detailed, avoiding fluff.
- Format the response with proper markdown headings and code blocks where applicable.`;
    }

    return {
      translation: translation,
      optimized: optimized,
      explanation: uiLanguage === "fa"
        ? "ترجمه رایگان (توجه: بدون کلید API، ساختار بهینه‌سازی شده به صورت قالب ایستا اعمال می‌شود.)"
        : "Free translation (Note: Without an API key, a static optimization template is applied.)"
    };
  } catch (err) {
    throw new Error("Failed to reach translation services: " + err.message);
  }
}
