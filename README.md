# Pillchecker: Intelligent Medication System 💊

An AI-powered web application specifically designed to help elderly users identify their medications and understand dosage instructions using just a smartphone camera.

## 🌟 Key Features

- **AI Medication Identification**: Uses Google Gemini 3 Flash to analyze medication labels from photos or gallery uploads.
- **Elderly-First Design**: 
  - **High Visibility**: Extra-large fonts (up to 60px for critical info) and high-contrast color schemes.
  - **Warm Aesthetics**: Uses a calming champagne and sage green palette to reduce user anxiety.
  - **Simplified Navigation**: Minimalist interface with large, tactile buttons.
- **Voice Guidance (TTS)**: Automatic and manual text-to-speech functionality that reads medicine names, dosages, and precautions aloud in multiple languages.
- **Safety Focused**: Highlights precautions and purpose in distinct, color-coded sections (e.g., Red for warnings).
- **History Tracking**: Automatically saves previous scans locally so users can revisit instructions without re-scanning.
- **Multilingual Support**: Available in English, Traditional Chinese (HK/TW), and Simplified Chinese.

## 🛠 Tech Stack

- **Framework**: React 19 (ES6+ Modules)
- **Styling**: Tailwind CSS
- **AI Engine**: @google/genai (Gemini 3 Flash Preview)
- **Icons**: Lucide React
- **Voice**: Web Speech API (SpeechSynthesis)
- **Deployment**: Optimized for mobile browser environments with camera access.

## 🚀 Getting Started

1. **Prerequisites**:
   - A modern web browser with camera and microphone permissions enabled.
   - A valid Google Gemini API Key.

2. **Environment Configuration**:
   - The application expects `process.env.API_KEY` to be configured for the Gemini SDK.

3. **Running the App**:
   - Open `index.html` in a local development server.
   - Ensure you are serving over `https` or `localhost` to allow camera access.

## ♿ Accessibility

This project prioritizes **WCAG 2.1** principles for elderly accessibility:
- **Perceivable**: Large text sizes and clear icons for users with vision impairment.
- **Operable**: Large touch targets for users with motor control difficulties.
- **Understandable**: Simplified language in AI prompts to avoid medical jargon.
- **Robust**: Works across major mobile browsers with responsive layouts.

## 📝 License

This project is created for educational and assistive purposes. Always consult a medical professional before taking any medication. AI identification should be used as a supplementary tool, not a primary medical diagnosis.
