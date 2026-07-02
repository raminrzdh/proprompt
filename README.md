# Pro Prompt Optimizer

Pro Prompt Optimizer is a high-performance, offline-capable Google Chrome extension designed to translate and optimize Persian and Arabic prompts into structured, professional English. It integrates directly into popular AI web interfaces (including ChatGPT, Claude, Gemini, Grok, DeepSeek, and Microsoft Copilot) to improve the quality of AI responses by engineering prompts on the fly.

## Key Features

- Multi-Provider Support: Connects to Groq Cloud, OpenAI, and Google Gemini Developer APIs.
- Free Translation Fallback: Uses free translation services with static structuring template configurations if no API key is available.
- Premium Localized UI/UX: Fully localized in English and Persian, featuring automatic LTR/RTL document-flow mirroring and dynamic layout adjustments.
- Offline Typography: Uses the Estedad variable font hosted locally within the extension package to guarantee privacy and fast rendering without Google Fonts dependencies.
- Injected Floating Trigger: Displays an overlay button inside AI chat inputs when Persian or Arabic text is typed, or triggers via hotkey (Ctrl + Shift + O).
- Prompt Library & History: Save frequently used custom prompts and access a localized log of recent prompt optimizations.

## Installation

To load the extension in Google Chrome or any Chromium-based browser:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable the "Developer Mode" toggle in the top-right corner.
4. Click the "Load unpacked" button in the top-left corner.
5. Select the root folder of the extension (`prompti/`).

## Architecture and Structure

- manifest.json: Main metadata and configuration file for the Chrome Extension (Manifest V3).
- background.js: Background Service Worker that handles secure API communication with AI providers and coordinates localization parameters.
- content/: Scripts and stylesheets injected inside pages. Operates via Shadow DOM to prevent host webpage CSS bleeding.
- popup/: The extension dashboard panel displaying provider options, key forms, preferences, history, and library.
- icons/: High-resolution branding assets and the local Estedad font files.

## Configuration

Once installed, click the extension icon in your toolbar to configure settings:

1. AI Provider: Choose between Groq Cloud, OpenAI, Google Gemini, or the Free Translator.
2. Credentials: Enter your API key and choose your preferred model (e.g., llama-3.3-70b-versatile, gpt-4o-mini, gemini-2.5-flash). All keys are securely stored locally via the chrome.storage.local API.
3. Templates: Choose your default prompt optimization structure (Standard/General, Coding, Content Writing, or Data Analysis).
4. Auto-detect: Enable or disable auto-detection parameters for Persian and Arabic inputs.

## License

This project is licensed under the MIT License.
