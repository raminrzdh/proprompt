document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const tabs = document.querySelectorAll(".ppo-tab-btn");
  const panels = document.querySelectorAll(".ppo-tab-panel");
  const saveStatus = document.getElementById("save-status");

  // Settings elements
  const apiProvider = document.getElementById("api-provider");
  const openaiCredentials = document.getElementById("openai-credentials");
  const groqCredentials = document.getElementById("groq-credentials");
  const geminiCredentials = document.getElementById("gemini-credentials");
  const freeDisclaimer = document.getElementById("free-disclaimer");

  const openaiApiKey = document.getElementById("openai-api-key");
  const openaiModel = document.getElementById("openai-model");
  const groqApiKey = document.getElementById("groq-api-key");
  const groqModel = document.getElementById("groq-model");
  const geminiApiKey = document.getElementById("gemini-api-key");
  const geminiModel = document.getElementById("gemini-model");

  const toggleAutodetect = document.getElementById("toggle-autodetect");
  const toggleFloating = document.getElementById("toggle-floating");
  const defaultTemplate = document.getElementById("default-template");
  const uiLanguage = document.getElementById("ui-language");

  // Library elements
  const libTitle = document.getElementById("lib-title");
  const libContent = document.getElementById("lib-content");
  const addPromptBtn = document.getElementById("add-prompt-btn");
  const libraryListContainer = document.getElementById("library-list-container");

  // History elements
  const historyListContainer = document.getElementById("history-list-container");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  // Translations
  const TRANSLATIONS = {
    en: {
      ext_title: "Pro Prompt Optimizer",
      ext_subtitle: "Optimize Persian & Arabic prompts dynamically",
      settings_tab: "Settings",
      library_tab: "Prompt Library",
      history_tab: "History",
      api_provider_label: "AI Provider",
      api_provider_groq: "Groq Cloud (Very Fast & Free)",
      api_provider_openai: "OpenAI (Highly Intelligent)",
      api_provider_gemini: "Google Gemini (Highly Intelligent)",
      api_provider_free: "Free Online Translator (No API Key Required)",
      openai_key_label: "OpenAI API Key",
      openai_model_label: "Default Model",
      groq_key_label: "Groq API Key",
      groq_key_help: "You can get a free key from the <a href=\"https://console.groq.com/keys\" target=\"_blank\">Groq Console</a>.",
      groq_model_label: "Default Model",
      gemini_key_label: "Google Gemini API Key",
      gemini_key_help: "You can get a free API key from the <a href=\"https://aistudio.google.com/\" target=\"_blank\">Google AI Studio</a>.",
      gemini_model_label: "Default Model",
      free_disclaimer_text: "<strong>Note:</strong> The free translation service only translates your Persian/Arabic text and applies static prompt structuring. For advanced AI-driven optimization, please use an API key.",
      prefs_title: "Extension Preferences",
      autodetect_title: "Auto-detect Persian/Arabic",
      autodetect_desc: "Show optimizer button when typing in Persian or Arabic in chat inputs",
      floating_title: "Show Floating Button",
      floating_desc: "Show a floating button in the bottom corner of AI text inputs",
      default_template_label: "Default Optimization Template",
      template_general: "Standard / General",
      template_coding: "Coding",
      template_writing: "Content Writing",
      template_analysis: "Data Analysis",
      ui_language_label: "Extension Language / زبان افزونه",
      save_success: "Settings saved successfully",
      lib_title_add: "Add New Prompt to Library",
      lib_title_placeholder: "Prompt Title (e.g., Java Code Formatter)",
      lib_content_placeholder: "Write your prompt text here...",
      lib_save_btn: "Save to Library",
      hist_title: "Recent Optimization History",
      hist_clear_btn: "Clear All",
      footer_help: "Help: Press <strong>Ctrl + Shift + O</strong> to quickly optimize the prompt in your current input.",
      empty_library: "Your library is empty. Add a prompt!",
      empty_history: "History is empty.",
      confirm_delete_prompt: "Are you sure you want to delete this prompt?",
      confirm_clear_history: "Are you sure you want to clear all history?",
      text_copied: "Copied!",
      label_original_fa: "Persian/Arabic Input:",
      label_optimized_en: "Optimized (EN):"
    },
    fa: {
      ext_title: "بهینه‌ساز پرامپت فارسی و عربی",
      ext_subtitle: "Pro Prompt Optimizer",
      settings_tab: "تنظیمات",
      library_tab: "کتابخانه پرامپت",
      history_tab: "تاریخچه",
      api_provider_label: "سرویس هوش مصنوعی / Provider",
      api_provider_groq: "Groq Cloud (بسیار سریع و رایگان)",
      api_provider_openai: "OpenAI (بسیار هوشمند)",
      api_provider_gemini: "Google Gemini (بسیار هوشمند)",
      api_provider_free: "مترجم آنلاین (بدون نیاز به کلید API)",
      openai_key_label: "کلید API OpenAI",
      openai_model_label: "مدل پیش‌فرض",
      groq_key_label: "کلید API Groq",
      groq_key_help: "می‌توانید کلید رایگان را از <a href=\"https://console.groq.com/keys\" target=\"_blank\">کنسول Groq</a> دریافت کنید.",
      groq_model_label: "مدل پیش‌فرض",
      gemini_key_label: "کلید API گوگل جمنی",
      gemini_key_help: "می‌توانید کلید API رایگان را از <a href=\"https://aistudio.google.com/\" target=\"_blank\">گوگل AI Studio</a> دریافت کنید.",
      gemini_model_label: "مدل پیش‌فرض",
      free_disclaimer_text: "<strong>توجه:</strong> سرویس ترجمه رایگان فقط متن فارسی و عربی شما را به انگلیسی ترجمه می‌کند و ساختار مهندسی پرامپت استاتیک ساده به آن اعمال می‌شود. برای بهینه‌سازی پیشرفته و کاملاً هوشمند، از کلیدهای API استفاده کنید.",
      prefs_title: "تنظیمات عملکرد افزونه",
      autodetect_title: "تشخیص خودکار زبان فارسی و عربی",
      autodetect_desc: "نمایش دکمه بهینه‌ساز هنگام نوشتن به زبان‌های فارسی/عربی در کادرهای چت",
      floating_title: "نمایش دکمه شناور",
      floating_desc: "نمایش دکمه شناور در گوشه پایین کادر ورود متن هوش مصنوعی",
      default_template_label: "قالب بهینه‌سازی پیش‌فرض",
      template_general: "عمومی (Standard)",
      template_coding: "برنامه‌نویسی (Coding)",
      template_writing: "نگارش محتوا (Writing)",
      template_analysis: "تحلیل داده (Analysis)",
      ui_language_label: "Extension Language / زبان افزونه",
      save_success: "تنظیمات با موفقیت ذخیره شد",
      lib_title_add: "افزودن پرامپت جدید به کتابخانه",
      lib_title_placeholder: "عنوان پرامپت (مثلا: فرمت‌ساز کدهای جاوا)",
      lib_content_placeholder: "متن پرامپت خود را بنویسید...",
      lib_save_btn: "ذخیره در کتابخانه",
      hist_title: "تاریخچه بهینه‌سازی‌های اخیر",
      hist_clear_btn: "حذف همه",
      footer_help: "راهنما: برای بهینه‌سازی سریع کلید ترکیبی <strong>Ctrl + Shift + O</strong> را بفشارید.",
      empty_library: "کتابخانه شما خالی است. پرامپتی اضافه کنید!",
      empty_history: "تاریخچه خالی است.",
      confirm_delete_prompt: "آیا از حذف این پرامپت اطمینان دارید؟",
      confirm_clear_history: "آیا مطمئن هستید که می‌خواهید کل تاریخچه را حذف کنید؟",
      text_copied: "کپی شد!",
      label_original_fa: "ورودی فارسی/عربی:",
      label_optimized_en: "نسخه بهینه‌شده (انگلیسی):"
    }
  };

  function translateUI(lang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.setAttribute("placeholder", TRANSLATIONS[lang][key]);
        } else {
          if (key === "footer_help" || key === "free_disclaimer_text" || key === "groq_key_help") {
            el.innerHTML = TRANSLATIONS[lang][key];
          } else {
            el.innerText = TRANSLATIONS[lang][key];
          }
        }
      }
    });

    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }

  // --- TAB NAVIGATION ---
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPanel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      // Load appropriate tab contents
      if (tab.dataset.tab === "library") {
        loadLibrary();
      } else if (tab.dataset.tab === "history") {
        loadHistory();
      }
    });
  });

  // --- SETTINGS CONTROLLER ---
  // Show/Hide credential panels based on Provider selection
  apiProvider.addEventListener("change", () => {
    updateProviderUI(apiProvider.value);
    autoSaveSettings();
  });

  function updateProviderUI(provider) {
    openaiCredentials.style.display = "none";
    groqCredentials.style.display = "none";
    geminiCredentials.style.display = "none";
    freeDisclaimer.style.display = "none";

    if (provider === "openai") {
      openaiCredentials.style.display = "block";
    } else if (provider === "groq") {
      groqCredentials.style.display = "block";
    } else if (provider === "gemini") {
      geminiCredentials.style.display = "block";
    } else if (provider === "free") {
      freeDisclaimer.style.display = "block";
    }
  }

  // Load Settings
  chrome.storage.local.get([
    "apiProvider",
    "openaiApiKey",
    "openaiModel",
    "groqApiKey",
    "groqModel",
    "geminiApiKey",
    "geminiModel",
    "autoDetect",
    "floatingButton",
    "defaultTemplate",
    "uiLanguage"
  ], (res) => {
    if (res.apiProvider) apiProvider.value = res.apiProvider;
    updateProviderUI(apiProvider.value);

    if (res.openaiApiKey) openaiApiKey.value = res.openaiApiKey;
    if (res.openaiModel) openaiModel.value = res.openaiModel;
    if (res.groqApiKey) groqApiKey.value = res.groqApiKey;
    if (res.groqModel) groqModel.value = res.groqModel;
    if (res.geminiApiKey) geminiApiKey.value = res.geminiApiKey;
    if (res.geminiModel) geminiModel.value = res.geminiModel;
    if (res.autoDetect !== undefined) toggleAutodetect.checked = res.autoDetect;
    if (res.floatingButton !== undefined) toggleFloating.checked = res.floatingButton;
    if (res.defaultTemplate) defaultTemplate.value = res.defaultTemplate;
    
    const currentLang = res.uiLanguage || "en";
    uiLanguage.value = currentLang;
    translateUI(currentLang);
  });

  // Auto-save listeners on all settings controls
  [openaiApiKey, openaiModel, groqApiKey, groqModel, geminiApiKey, geminiModel, defaultTemplate, uiLanguage].forEach(el => {
    el.addEventListener("change", autoSaveSettings);
  });
  // Trigger save on password field typeout with debounce (300ms) or immediate blur
  let saveTimeout;
  [openaiApiKey, groqApiKey, geminiApiKey].forEach(el => {
    el.addEventListener("input", () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(autoSaveSettings, 300);
    });
    el.addEventListener("blur", () => {
      clearTimeout(saveTimeout);
      autoSaveSettings();
    });
  });

  [toggleAutodetect, toggleFloating].forEach(el => {
    el.addEventListener("change", autoSaveSettings);
  });

  function autoSaveSettings() {
    const data = {
      apiProvider: apiProvider.value,
      openaiApiKey: openaiApiKey.value,
      openaiModel: openaiModel.value,
      groqApiKey: groqApiKey.value,
      groqModel: groqModel.value,
      geminiApiKey: geminiApiKey.value,
      geminiModel: geminiModel.value,
      autoDetect: toggleAutodetect.checked,
      floatingButton: toggleFloating.checked,
      defaultTemplate: defaultTemplate.value,
      uiLanguage: uiLanguage.value
    };

    chrome.storage.local.set(data, () => {
      translateUI(uiLanguage.value);
      saveStatus.classList.add("show");
      setTimeout(() => {
        saveStatus.classList.remove("show");
      }, 1500);
    });
  }

  // --- PROMPT LIBRARY CONTROLLER ---
  addPromptBtn.addEventListener("click", () => {
    chrome.storage.local.get(["uiLanguage"], (res) => {
      const lang = res.uiLanguage || "en";
      const title = libTitle.value.trim();
      const content = libContent.value.trim();

      if (!title || !content) {
        alert(lang === "fa" ? "لطفاً هم عنوان و هم متن پرامپت را وارد کنید." : "Please enter both prompt title and content.");
        return;
      }

      chrome.storage.local.get(["savedPrompts"], (storageRes) => {
        const prompts = storageRes.savedPrompts || [];
        const newPrompt = {
          id: "lib_" + Date.now(),
          title: title,
          content: content
        };

        prompts.unshift(newPrompt);
        chrome.storage.local.set({ savedPrompts: prompts }, () => {
          libTitle.value = "";
          libContent.value = "";
          loadLibrary();
        });
      });
    });
  });

  function loadLibrary() {
    chrome.storage.local.get(["savedPrompts", "uiLanguage"], (res) => {
      const prompts = res.savedPrompts || [];
      const lang = res.uiLanguage || "en";
      libraryListContainer.innerHTML = "";

      if (prompts.length === 0) {
        libraryListContainer.innerHTML = `<div class="ppo-empty-state">${TRANSLATIONS[lang].empty_library}</div>`;
        return;
      }

      prompts.forEach(p => {
        const item = document.createElement("div");
        item.className = "ppo-lib-item";
        item.innerHTML = `
          <div class="ppo-item-header">
            <div class="ppo-item-title">${escapeHTML(p.title)}</div>
            <div class="ppo-item-actions">
              <button class="ppo-action-btn copy-lib-btn" data-id="${p.id}" title="${lang === 'fa' ? 'کپی پرامپت' : 'Copy Prompt'}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="ppo-action-btn delete delete-lib-btn" data-id="${p.id}" title="${lang === 'fa' ? 'حذف' : 'Delete'}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="ppo-item-body">${escapeHTML(p.content)}</div>
        `;
        libraryListContainer.appendChild(item);
      });

      // Bind actions
      document.querySelectorAll(".copy-lib-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const prompt = prompts.find(p => p.id === id);
          if (prompt) {
            navigator.clipboard.writeText(prompt.content).then(() => {
              const svg = btn.innerHTML;
              btn.innerHTML = `<span style="color:#10b981; font-size:10px;">${TRANSLATIONS[lang].text_copied}</span>`;
              setTimeout(() => btn.innerHTML = svg, 1500);
            });
          }
        });
      });

      document.querySelectorAll(".delete-lib-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm(TRANSLATIONS[lang].confirm_delete_prompt)) {
            const updated = prompts.filter(p => p.id !== id);
            chrome.storage.local.set({ savedPrompts: updated }, loadLibrary);
          }
        });
      });
    });
  }

  // --- HISTORY CONTROLLER ---
  clearHistoryBtn.addEventListener("click", () => {
    chrome.storage.local.get(["uiLanguage"], (res) => {
      const lang = res.uiLanguage || "en";
      if (confirm(TRANSLATIONS[lang].confirm_clear_history)) {
        chrome.storage.local.set({ history: [] }, loadHistory);
      }
    });
  });

  function loadHistory() {
    chrome.storage.local.get(["history", "uiLanguage"], (res) => {
      const history = res.history || [];
      const lang = res.uiLanguage || "en";
      historyListContainer.innerHTML = "";

      if (history.length === 0) {
        historyListContainer.innerHTML = `<div class="ppo-empty-state">${TRANSLATIONS[lang].empty_history}</div>`;
        return;
      }

      history.forEach(h => {
        let dateStr;
        if (lang === "fa") {
          dateStr = new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date(h.timestamp).toLocaleDateString('fa-IR');
        } else {
          dateStr = new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date(h.timestamp).toLocaleDateString('en-US');
        }
        
        const item = document.createElement("div");
        item.className = "ppo-hist-item";
        
        let templateText = "General";
        if (lang === "fa") {
          templateText = "عمومی";
          if (h.template === "coding") templateText = "برنامه‌نویسی";
          if (h.template === "writing") templateText = "نگارش";
          if (h.template === "analysis") templateText = "تحلیل";
        } else {
          templateText = "General";
          if (h.template === "coding") templateText = "Coding";
          if (h.template === "writing") templateText = "Writing";
          if (h.template === "analysis") templateText = "Analysis";
        }

        item.innerHTML = `
          <div class="ppo-item-header">
            <div class="ppo-hist-meta">${dateStr} [${templateText}]</div>
            <div class="ppo-item-actions">
              <button class="ppo-action-btn copy-hist-btn" data-id="${h.id}" title="${lang === 'fa' ? 'کپی پرامپت بهینه' : 'Copy Optimized Prompt'}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="ppo-action-btn delete delete-hist-btn" data-id="${h.id}" title="${lang === 'fa' ? 'حذف' : 'Delete'}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="ppo-item-body" style="direction:rtl; text-align:right;"><strong>${TRANSLATIONS[lang].label_original_fa}</strong> ${escapeHTML(h.original)}</div>
          <div class="ppo-item-body en" style="margin-top:6px;"><strong>${TRANSLATIONS[lang].label_optimized_en}</strong><br>${escapeHTML(h.optimized)}</div>
        `;
        historyListContainer.appendChild(item);
      });

      // Bind actions
      document.querySelectorAll(".copy-hist-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const histItem = history.find(h => h.id === id);
          if (histItem) {
            navigator.clipboard.writeText(histItem.optimized).then(() => {
              const svg = btn.innerHTML;
              btn.innerHTML = `<span style="color:#10b981; font-size:10px;">${TRANSLATIONS[lang].text_copied}</span>`;
              setTimeout(() => btn.innerHTML = svg, 1500);
            });
          }
        });
      });

      document.querySelectorAll(".delete-hist-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const updated = history.filter(h => h.id !== id);
          chrome.storage.local.set({ history: updated }, loadHistory);
        });
      });
    });
  }

  // Escape HTML helper
  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
