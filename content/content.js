(function () {
  // Prevent double injection
  if (window.ppoInitialized) return;
  window.ppoInitialized = true;

  // Inject local Estedad font into webpage DOM for fallbacks
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @font-face {
      font-family: 'EstedadPage';
      src: url('${chrome.runtime.getURL("icons/font/Estedad-VariableFont_wght.ttf")}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
    }
    @font-face {
      font-family: 'sans-serif';
      src: url('${chrome.runtime.getURL("icons/font/Estedad-VariableFont_wght.ttf")}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
    }
    @font-face {
      font-family: 'system-ui';
      src: url('${chrome.runtime.getURL("icons/font/Estedad-VariableFont_wght.ttf")}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
    }
    @font-face {
      font-family: '-apple-system';
      src: url('${chrome.runtime.getURL("icons/font/Estedad-VariableFont_wght.ttf")}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
    }
    @font-face {
      font-family: 'BlinkMacSystemFont';
      src: url('${chrome.runtime.getURL("icons/font/Estedad-VariableFont_wght.ttf")}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
    }
  `;
  document.documentElement.appendChild(styleEl);

  // Prepend EstedadPage to root computed font-family to override fallback chains on host websites (preserves Latin design fonts)
  try {
    const htmlFont = window.getComputedStyle(document.documentElement).fontFamily;
    const styleOverride = document.createElement("style");
    styleOverride.textContent = `
      html, body, p, span, li, a, h1, h2, h3, h4, h5, h6, textarea, input, [contenteditable="true"] { 
        font-family: 'EstedadPage', ${htmlFont} !important; 
      }
      pre, code, pre *, code * {
        font-family: monospace !important;
      }
    `;
    document.documentElement.appendChild(styleOverride);
  } catch (err) {
    console.warn("Could not dynamically append EstedadPage font-family:", err);
  }

  // Global states
  let activeElement = null;
  let originalPromptText = "";
  let lastOptimizedPrompt = "";
  let settings = {
    autoDetect: true,
    floatingButton: true,
    defaultTemplate: "general",
    uiLanguage: "en"
  };

  // Translations for the modal UI
  const TRANSLATIONS = {
    en: {
      modalTitle: "Pro Prompt Optimizer",
      modalSubtitle: "Optimize Persian & Arabic prompts dynamically",
      templateLabel: "Optimization Template:",
      reoptimizeBtn: "Re-optimize",
      loadingText: "Translating & engineering prompt by AI...",
      loadingSubtext: "Translating & engineering prompt, please wait...",
      originalTextareaPlaceholder: "Original prompt...",
      optimizedTextareaPlaceholder: "Optimized prompt will appear here...",
      errorTitle: "Optimization Error",
      cancelBtn: "Cancel",
      copyBtn: "Copy",
      insertBtn: "Insert into Chat",
      toastMsg: "English prompt inserted.",
      toastUndo: "Undo",
      badgeEn: "English",
      badgeFa: "Persian",
      badgeAr: "Arabic",
      originalTitleFa: "Original Prompt (Persian)",
      originalTitleAr: "Original Prompt (Arabic)",
      originalTitleEn: "Original Prompt (English)"
    },
    fa: {
      modalTitle: "بهینه‌ساز پرامپت فارسی و عربی",
      modalSubtitle: "Pro Prompt Optimizer",
      templateLabel: "قالب بهینه‌سازی / Template:",
      reoptimizeBtn: "بهینه‌سازی مجدد",
      loadingText: "در حال ترجمه و ساختاردهی پرامپت توسط هوش مصنوعی...",
      loadingSubtext: "Translating & engineering prompt, please wait...",
      originalTextareaPlaceholder: "پرامپت اولیه شما...",
      optimizedTextareaPlaceholder: "پرامپت بهینه‌سازی شده در این قسمت نمایش داده می‌شود...",
      errorTitle: "خطا در بهینه‌سازی",
      cancelBtn: "انصراف",
      copyBtn: "کپی کردن",
      insertBtn: "جایگذاری در چت",
      toastMsg: "پرامپت انگلیسی جایگزین شد.",
      toastUndo: "بازگشت (Undo)",
      badgeEn: "انگلیسی",
      badgeFa: "فارسی",
      badgeAr: "عربی",
      originalTitleFa: "پرامپت اولیه شما (فارسی)",
      originalTitleAr: "پرامپت اولیه شما (عربی)",
      originalTitleEn: "پرامپت اولیه شما (انگلیسی)"
    }
  };

  // Shadow DOM setup
  const host = document.createElement("div");
  host.id = "persian-prompt-optimizer-host";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  // Inject Stylesheet link
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("content/content.css");
  shadow.appendChild(link);

  // Injected UI elements container
  const uiContainer = document.createElement("div");
  shadow.appendChild(uiContainer);

  // Render core elements to Shadow DOM
  uiContainer.innerHTML = `
    <!-- Floating trigger button -->
    <button class="ppo-floating-btn" id="ppo-float-btn" title="بهینه‌ساز پرامپت فارسی و عربی (Ctrl+Shift+O)">
      <svg viewBox="0 0 24 24">
        <path d="M12 2l2.56 5.18L20.27 8l-4.14 4.03 1 5.7L12 15l-5.13 2.7 1-5.7-4.14-4.03 5.71-.82L12 2z" />
      </svg>
    </button>

    <!-- Overlay / Modal -->
    <div class="ppo-modal-overlay" id="ppo-modal">
      <div class="ppo-modal-container">
        <!-- Header -->
        <div class="ppo-modal-header">
          <div class="ppo-modal-title">
            <svg viewBox="0 0 24 24">
              <path d="M12 2l2.56 5.18L20.27 8l-4.14 4.03 1 5.7L12 15l-5.13 2.7 1-5.7-4.14-4.03 5.71-.82L12 2z" />
            </svg>
            <h2>بهینه‌ساز پرامپت فارسی و عربی</h2>
            <span>Pro Prompt Optimizer</span>
          </div>
          <button class="ppo-close-btn" id="ppo-close-x" title="Close / بستن">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="ppo-modal-body">
          <!-- Selection & Controls -->
          <div class="ppo-controls-row">
            <div class="ppo-template-selector">
              <label class="ppo-template-label">قالب بهینه‌سازی / Template:</label>
              <select class="ppo-select" id="ppo-template-select">
                <option value="general">Standard / General</option>
                <option value="coding">Coding</option>
                <option value="writing">Content Writing</option>
                <option value="analysis">Data Analysis</option>
              </select>
            </div>
            <button class="ppo-btn ppo-btn-outline" id="ppo-reoptimize-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              بهینه‌سازی مجدد
            </button>
          </div>

          <!-- Loading Panel -->
          <div class="ppo-loading-container" id="ppo-loading" style="display: none;">
            <div class="ppo-spinner-glow">
              <div class="ppo-spinner"></div>
              <div class="ppo-spinner-inner"></div>
            </div>
            <div class="ppo-loading-text">
              در حال ترجمه و ساختاردهی پرامپت توسط هوش مصنوعی...
              <div class="ppo-loading-subtext">Translating & engineering prompt, please wait...</div>
            </div>
          </div>

          <!-- Content Panel -->
          <div id="ppo-content-panel" style="display: none;">
            <!-- Persian/Arabic Prompt (Original) -->
            <div class="ppo-text-section" style="margin-bottom: 15px;">
              <div class="ppo-section-header">
                <div class="ppo-section-title fa" id="ppo-original-title">پرامپت اولیه شما</div>
                <span class="ppo-badge ppo-badge-fa" id="ppo-original-badge">Persian</span>
              </div>
              <textarea class="ppo-textarea fa" id="ppo-original-textarea"></textarea>
            </div>

            <!-- Optimized English Prompt -->
            <div class="ppo-text-section">
              <div class="ppo-section-header">
                <div class="ppo-section-title">Optimized Prompt (English)</div>
                <span class="ppo-badge ppo-badge-en">LTR Prompt</span>
              </div>
              <textarea class="ppo-textarea en" id="ppo-optimized-textarea" placeholder="Optimized prompt will appear here..."></textarea>
            </div>

            <!-- Explanation -->
            <div class="ppo-explanation-box" id="ppo-explanation" style="margin-top: 15px;"></div>
          </div>

          <!-- Error Panel -->
          <div class="ppo-error-container" id="ppo-error" style="display: none;">
            <div class="ppo-error-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              خطا در بهینه‌سازی
            </div>
            <div class="ppo-error-message" id="ppo-error-text">توضیح خطا</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="ppo-modal-footer">
          <button class="ppo-btn ppo-btn-secondary" id="ppo-cancel-btn">انصراف (Cancel)</button>
          <button class="ppo-btn ppo-btn-outline" id="ppo-copy-btn">کپی کردن (Copy)</button>
          <button class="ppo-btn ppo-btn-primary" id="ppo-insert-btn">
            جایگذاری در چت
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast container for undo -->
    <div class="ppo-toast-container" id="ppo-toast-box"></div>
  `;

  // Get DOM handles from Shadow DOM
  const floatBtn = shadow.getElementById("ppo-float-btn");
  const modal = shadow.getElementById("ppo-modal");
  const closeX = shadow.getElementById("ppo-close-x");
  const cancelBtn = shadow.getElementById("ppo-cancel-btn");
  const copyBtn = shadow.getElementById("ppo-copy-btn");
  const insertBtn = shadow.getElementById("ppo-insert-btn");
  const reoptimizeBtn = shadow.getElementById("ppo-reoptimize-btn");
  const templateSelect = shadow.getElementById("ppo-template-select");

  const ppoLoading = shadow.getElementById("ppo-loading");
  const ppoContentPanel = shadow.getElementById("ppo-content-panel");
  const ppoError = shadow.getElementById("ppo-error");
  const ppoErrorText = shadow.getElementById("ppo-error-text");

  const originalTextarea = shadow.getElementById("ppo-original-textarea");
  const originalBadge = shadow.getElementById("ppo-original-badge");
  const originalTitle = shadow.getElementById("ppo-original-title");
  const optimizedTextarea = shadow.getElementById("ppo-optimized-textarea");
  const explanationBox = shadow.getElementById("ppo-explanation");
  const toastBox = shadow.getElementById("ppo-toast-box");

  // Localize all UI elements inside the shadow DOM
  function localizeModal(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    shadow.querySelector(".ppo-modal-title h2").innerText = t.modalTitle;
    shadow.querySelector(".ppo-modal-title span").innerText = t.modalSubtitle;
    shadow.querySelector(".ppo-template-label").innerText = t.templateLabel;

    if (floatBtn) {
      floatBtn.title = lang === "fa"
        ? "بهینه‌ساز پرامپت فارسی و عربی (Ctrl+Shift+O)"
        : "Pro Prompt Optimizer (Ctrl+Shift+O)";
    }
    
    if (templateSelect) {
      templateSelect.options[0].text = lang === "fa" ? "عمومی (Standard)" : "Standard / General";
      templateSelect.options[1].text = lang === "fa" ? "برنامه‌نویسی (Coding)" : "Coding";
      templateSelect.options[2].text = lang === "fa" ? "نگارش محتوا (Writing)" : "Content Writing";
      templateSelect.options[3].text = lang === "fa" ? "تحلیل داده (Analysis)" : "Data Analysis";
    }

    reoptimizeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
      </svg>
      ${t.reoptimizeBtn}
    `;

    shadow.querySelector(".ppo-loading-text").childNodes[0].nodeValue = t.loadingText + "\n";
    shadow.querySelector(".ppo-loading-subtext").innerText = t.loadingSubtext;

    originalTextarea.placeholder = t.originalTextareaPlaceholder;
    optimizedTextarea.placeholder = t.optimizedTextareaPlaceholder;

    shadow.querySelector(".ppo-error-title").innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      ${t.errorTitle}
    `;

    cancelBtn.innerText = t.cancelBtn;
    copyBtn.innerText = t.copyBtn;
    insertBtn.innerHTML = `
      ${t.insertBtn}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;

    modal.style.direction = lang === "fa" ? "rtl" : "ltr";
  }

  // Load configuration from local storage
  function loadSettings() {
    chrome.storage.local.get(["autoDetect", "floatingButton", "defaultTemplate", "uiLanguage"], (res) => {
      if (res.autoDetect !== undefined) settings.autoDetect = res.autoDetect;
      if (res.floatingButton !== undefined) settings.floatingButton = res.floatingButton;
      if (res.defaultTemplate !== undefined) {
        settings.defaultTemplate = res.defaultTemplate;
        templateSelect.value = res.defaultTemplate;
      }
      if (res.uiLanguage !== undefined) {
        settings.uiLanguage = res.uiLanguage;
        localizeModal(res.uiLanguage);
      } else {
        localizeModal("en"); // Default is English
      }
    });
  }

  loadSettings();

  // Listen for storage changes in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.autoDetect) settings.autoDetect = changes.autoDetect.newValue;
    if (changes.floatingButton) settings.floatingButton = changes.floatingButton.newValue;
    if (changes.defaultTemplate) {
      settings.defaultTemplate = changes.defaultTemplate.newValue;
      templateSelect.value = changes.defaultTemplate.newValue;
    }
    if (changes.uiLanguage) {
      settings.uiLanguage = changes.uiLanguage.newValue;
      localizeModal(changes.uiLanguage.newValue);
      updateOriginalUI(originalTextarea.value);
    }
  });

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

  // Update floating button position
  function positionFloatingButton(element) {
    if (!element || !settings.floatingButton) {
      floatBtn.classList.remove("ppo-visible");
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      floatBtn.classList.remove("ppo-visible");
      return;
    }

    // Place inside bottom right or bottom left of input/textarea depending on language direction
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    const text = element.value || element.innerText || "";
    const lang = detectLanguage(text);
    const isRTL = (lang === "fa" || lang === "ar");

    let x;
    if (isRTL) {
      x = scrollX + rect.left + 12;
    } else {
      x = scrollX + rect.right - 44;
    }
    const y = scrollY + rect.bottom - 44;

    floatBtn.style.left = `${x}px`;
    floatBtn.style.top = `${y}px`;
    floatBtn.classList.add("ppo-visible");
  }

  function adjustInputDirectionAndFont(el, text) {
    if (!text || !text.trim()) return;
    const lang = detectLanguage(text);
    const isRTL = (lang === "fa" || lang === "ar");
    el.style.direction = isRTL ? "rtl" : "ltr";
    el.style.textAlign = isRTL ? "right" : "left";
    el.style.fontFamily = "'Estedad', system-ui, -apple-system, sans-serif";
  }

  // Handle global page event listeners for input targeting
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text") || el.getAttribute("contenteditable") === "true") {
      activeElement = el;
      const text = activeElement.value || activeElement.innerText || "";
      adjustInputDirectionAndFont(activeElement, text);
      if (settings.autoDetect && text.trim().length > 0) {
        positionFloatingButton(activeElement);
      } else {
        floatBtn.classList.remove("ppo-visible");
      }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target === activeElement) {
      const text = activeElement.value || activeElement.innerText || "";
      adjustInputDirectionAndFont(activeElement, text);
      if (settings.autoDetect && text.trim().length > 0) {
        positionFloatingButton(activeElement);
      } else {
        floatBtn.classList.remove("ppo-visible");
      }
    }
  });

  // Reposition floating button on viewport mutations
  window.addEventListener("resize", () => {
    if (activeElement && floatBtn.classList.contains("ppo-visible")) {
      positionFloatingButton(activeElement);
    }
  });

  document.addEventListener("scroll", () => {
    if (activeElement && floatBtn.classList.contains("ppo-visible")) {
      positionFloatingButton(activeElement);
    }
  }, true);

  // Close floating button on blur, but delay it so it can be clicked
  document.addEventListener("focusout", (e) => {
    setTimeout(() => {
      if (activeElement === e.target && !modal.classList.contains("ppo-open")) {
        floatBtn.classList.remove("ppo-visible");
      }
    }, 250);
  });

  // Hotkey listener (Ctrl+Shift+O / Cmd+Shift+O)
  document.addEventListener("keydown", (e) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    if (isCmdOrCtrl && e.shiftKey && e.code === "KeyO") {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT" || activeEl.getAttribute("contenteditable") === "true")) {
        e.preventDefault();
        activeElement = activeEl;
        triggerOptimizationFlow();
      }
    }

    if (modal.classList.contains("ppo-open")) {
      if (e.key === "Escape") {
        closeModal();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        insertPrompt();
      }
    }
  });

  // Hook UI buttons
  floatBtn.addEventListener("click", (e) => {
    e.preventDefault();
    triggerOptimizationFlow();
  });

  closeX.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  
  copyBtn.addEventListener("click", () => {
    const text = optimizedTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = copyBtn.innerText;
      const extLang = settings.uiLanguage || "en";
      copyBtn.innerText = extLang === "fa" ? "کپی شد!" : "Copied!";
      copyBtn.style.borderColor = "#10b981";
      setTimeout(() => {
        copyBtn.innerText = originalText;
        copyBtn.style.borderColor = "";
      }, 1500);
    });
  });

  insertBtn.addEventListener("click", insertPrompt);

  reoptimizeBtn.addEventListener("click", () => {
    const originalText = originalTextarea.value;
    const selectedTemplate = templateSelect.value;
    runOptimization(originalText, selectedTemplate);
  });

  originalTextarea.addEventListener("input", () => {
    updateOriginalUI(originalTextarea.value);
  });

  function updateOriginalUI(text) {
    const lang = detectLanguage(text);
    const extLang = settings.uiLanguage || "en";
    const t = TRANSLATIONS[extLang] || TRANSLATIONS.en;

    if (lang === "fa") {
      originalTextarea.className = "ppo-textarea fa";
      originalTextarea.style.direction = "rtl";
      originalTextarea.style.textAlign = "right";
      originalBadge.innerText = t.badgeFa;
      originalBadge.className = "ppo-badge ppo-badge-fa";
      originalTitle.innerText = t.originalTitleFa;
      originalTitle.style.direction = "rtl";
    } else if (lang === "ar") {
      originalTextarea.className = "ppo-textarea ar";
      originalTextarea.style.direction = "rtl";
      originalTextarea.style.textAlign = "right";
      originalBadge.innerText = t.badgeAr;
      originalBadge.className = "ppo-badge ppo-badge-ar";
      originalTitle.innerText = t.originalTitleAr;
      originalTitle.style.direction = "rtl";
    } else {
      originalTextarea.className = "ppo-textarea en";
      originalTextarea.style.direction = "ltr";
      originalTextarea.style.textAlign = "left";
      originalBadge.innerText = t.badgeEn;
      originalBadge.className = "ppo-badge ppo-badge-en";
      originalTitle.innerText = t.originalTitleEn;
      originalTitle.style.direction = "ltr";
    }
  }

  // Run the core prompt processing logic
  function triggerOptimizationFlow() {
    if (!activeElement) return;

    const text = activeElement.value || activeElement.innerText || "";
    if (!text.trim()) return;

    originalTextarea.value = text;
    originalPromptText = text;
    
    updateOriginalUI(text);
    
    modal.classList.add("ppo-open");
    floatBtn.classList.remove("ppo-visible");

    runOptimization(text, templateSelect.value);
  }

  function runOptimization(text, templateId) {
    ppoError.style.display = "none";
    ppoContentPanel.style.display = "none";
    ppoLoading.style.display = "flex";
    insertBtn.disabled = true;
    copyBtn.disabled = true;

    const lang = detectLanguage(text);

    chrome.runtime.sendMessage(
      {
        action: "optimizePrompt",
        payload: {
          prompt: text,
          templateId: templateId,
          lang: lang
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          const extLang = settings.uiLanguage || "en";
          const errMsg = extLang === "fa"
            ? "ارتباط با افزونه برقرار نشد. لطفاً صفحه را رفرش کنید: "
            : "Could not connect to extension. Please refresh the page: ";
          showError(errMsg + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          const result = response.data;
          optimizedTextarea.value = result.optimized;
          lastOptimizedPrompt = result.optimized;
          explanationBox.innerText = result.explanation || "";
          
          ppoLoading.style.display = "none";
          ppoContentPanel.style.display = "block";
          insertBtn.disabled = false;
          copyBtn.disabled = false;
        } else {
          const errorMsg = response ? response.error : "خطای نامشخص در پس‌زمینه";
          showError(errorMsg);
        }
      }
    );
  }

  function showError(msg) {
    ppoLoading.style.display = "none";
    ppoError.style.display = "flex";
    ppoErrorText.innerText = msg;
    insertBtn.disabled = true;
    copyBtn.disabled = true;
  }

  function closeModal() {
    modal.classList.remove("ppo-open");
    if (activeElement && (activeElement.value || activeElement.innerText || "").trim().length > 0) {
      positionFloatingButton(activeElement);
    }
  }

  function insertPrompt() {
    if (!activeElement) {
      closeModal();
      return;
    }

    const optimizedVal = optimizedTextarea.value;
    const backupText = activeElement.value || activeElement.innerText || "";
    const lang = detectLanguage(backupText);
    const isRTL = (lang === "fa" || lang === "ar");
    
    activeElement.style.direction = "ltr";
    activeElement.style.textAlign = "left";

    if (activeElement.tagName === "TEXTAREA" || (activeElement.tagName === "INPUT" && activeElement.type === "text")) {
      activeElement.value = optimizedVal;
    } else if (activeElement.getAttribute("contenteditable") === "true") {
      activeElement.innerText = optimizedVal;
    }

    activeElement.dispatchEvent(new Event("input", { bubbles: true }));
    activeElement.dispatchEvent(new Event("change", { bubbles: true }));
    
    closeModal();
    showUndoToast(backupText, activeElement, isRTL);
  }

  function showUndoToast(originalText, targetEl, isRTL) {
    const toastId = "toast_" + Date.now();
    const extLang = settings.uiLanguage || "en";
    const t = TRANSLATIONS[extLang] || TRANSLATIONS.en;
    
    const toast = document.createElement("div");
    toast.className = "ppo-toast";
    toast.id = toastId;
    
    toast.innerHTML = `
      <div class="ppo-toast-msg">${t.toastMsg}</div>
      <button class="ppo-toast-undo-btn" id="undo-${toastId}">${t.toastUndo}</button>
    `;

    toastBox.appendChild(toast);

    const undoBtn = shadow.getElementById(`undo-${toastId}`);
    undoBtn.addEventListener("click", () => {
      targetEl.style.direction = isRTL ? "rtl" : "ltr";
      targetEl.style.textAlign = isRTL ? "right" : "left";

      if (targetEl.tagName === "TEXTAREA" || (targetEl.tagName === "INPUT" && targetEl.type === "text")) {
        targetEl.value = originalText;
      } else if (targetEl.getAttribute("contenteditable") === "true") {
        targetEl.innerText = originalText;
      }

      targetEl.dispatchEvent(new Event("input", { bubbles: true }));
      targetEl.dispatchEvent(new Event("change", { bubbles: true }));

      toast.classList.add("ppo-fade-out");
      setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
      if (shadow.getElementById(toastId)) {
        toast.classList.add("ppo-fade-out");
        setTimeout(() => toast.remove(), 300);
      }
    }, 8000);
  }
})();
