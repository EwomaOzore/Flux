export type LegalSection = {
  readonly title: string;
  readonly body: string;
};

export const LEGAL_LAST_UPDATED = "September 4, 2026";

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    title: "Do we collect your data?",
    body: "Short answer: Flux does not collect your budget, income, bills, receipts, or other financial details. Those stay on your device. We do not create accounts, and we do not sell or share your personal information. Limited anonymous technical diagnostics may be sent to Expo (our app platform) so we can keep the app working — details below. That technical data does not include your budget numbers or receipt images.",
  },
  {
    title: "Overview",
    body: "Flux is a personal payday and budget calculator. You enter amounts yourself. Flux does not connect to banks, move money, open accounts, or sync your financial entries to Flux-operated servers.",
  },
  {
    title: "Data stored only on your device",
    body: "The following stays on your phone or tablet unless you export or share it yourself: income streams, bills, timeline/line items, currency preference, appearance settings, biometric lock preference, payday reminder settings, and any receipt text you extract for expense entry. Uninstalling the app or clearing app data permanently deletes this on-device information. Because it never leaves your device through Flux, we cannot recover it for you.",
  },
  {
    title: "Camera and photos",
    body: "If you scan or attach a receipt, Flux asks for camera or photo library access. Images are processed on your device for text extraction. Receipt images and OCR results are not uploaded to Flux servers.",
  },
  {
    title: "Biometric lock",
    body: "If you enable biometric lock, Flux uses Face ID, Touch ID, fingerprint, or your device PIN through the operating system. Flux never receives or stores your biometric templates — only a local preference that lock is on.",
  },
  {
    title: "Notifications",
    body: "If you enable payday reminders, Flux schedules local notifications on your device. Reminder content is not sent to us.",
  },
  {
    title: "Export and import",
    body: "Export creates a file you control (share, save, or delete). Import reads a file you choose. Flux does not transmit export files to us.",
  },
  {
    title: "Technical diagnostics (Expo)",
    body: "Flux uses Expo Application Services for optional over-the-air updates and the expo-insights library. When enabled by the platform, this may send anonymous technical signals such as app version, platform (iOS/Android), OS version, project/app identifier, and an anonymous client identifier used for update and usage trends. This is not your budget data, and it is not used to identify you personally for marketing or advertising.",
  },
  {
    title: "What we do not collect",
    body: "Flux does not collect names, emails, phone numbers, location, contacts, payment card details, bank credentials, advertising IDs for ads, or browsing history. Flux does not include advertising SDKs.",
  },
  {
    title: "Sharing and selling",
    body: "We do not sell your personal information. We do not share your budget data with third parties because we do not receive it. Technical diagnostics described above are processed by Expo as our service provider for app reliability and updates, under Expo’s privacy practices.",
  },
  {
    title: "Children",
    body: "Flux is not directed at children under 13 (or the equivalent minimum age in your region). We do not knowingly collect personal information from children.",
  },
  {
    title: "Your choices",
    body: "You can turn off biometric lock and reminders in Settings, deny camera/photo permissions in system settings, clear or uninstall the app to delete on-device data, and avoid exporting if you do not want a portable copy of your data.",
  },
  {
    title: "Changes",
    body: "We may update this policy. The “Last updated” date at the top will change when we do. Continued use after an update means you accept the revised policy.",
  },
  {
    title: "Contact",
    body: "Privacy questions: use the support email on the App Store or Google Play listing for Flux.",
  },
];

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    title: "Agreement",
    body: "By downloading, installing, or using Flux (“the App”), you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, do not use the App.",
  },
  {
    title: "What Flux is",
    body: "Flux is a personal calculator and planner for amounts you enter yourself — such as income streams, bills, and payday cushion estimates. It is a productivity tool, not a bank, broker, lender, payment service, tax service, or investment platform.",
  },
  {
    title: "What Flux is not",
    body: "Flux does not move money, hold funds, open financial accounts, connect to your bank, execute trades, offer loans, sell insurance, or provide regulated financial, investment, tax, or legal advice. Any totals, cushions, or projections are arithmetic based on numbers you typed — not recommendations.",
  },
  {
    title: "Not financial advice",
    body: "Nothing in Flux is personalized financial advice or a substitute for advice from a qualified professional licensed in your jurisdiction. You alone are responsible for financial decisions you make. Do not rely on Flux as the sole basis for borrowing, investing, budgeting commitments, or other money decisions.",
  },
  {
    title: "Accuracy",
    body: "You are responsible for the accuracy of amounts and dates you enter. Currency conversion, if you perform it mentally or elsewhere before entering figures, is your responsibility. Flux may contain bugs or display errors; verify important numbers independently.",
  },
  {
    title: "Your data and backups",
    body: "Budget data is stored on your device. We do not provide cloud backup of your entries. Export regularly if you need a copy. We are not liable for data loss from device failure, uninstall, OS updates, or forgotten backups.",
  },
  {
    title: "Acceptable use",
    body: "Use Flux only for lawful personal budgeting and planning. Do not misuse the App, attempt to disrupt it, or use it to facilitate fraud or illegal activity.",
  },
  {
    title: "Intellectual property",
    body: "Flux’s name, design, and software are owned by the developer. You receive a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes in accordance with these Terms and the store’s rules.",
  },
  {
    title: "Disclaimer of warranties",
    body: "THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the App will be uninterrupted, error-free, or that results will meet your expectations.",
  },
  {
    title: "Limitation of liability",
    body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE DEVELOPER IS NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, OR OPPORTUNITY, ARISING FROM YOUR USE OF OR INABILITY TO USE THE APP — INCLUDING FINANCIAL DECISIONS YOU MAKE AFTER USING THE APP. OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE APP WILL NOT EXCEED THE AMOUNT YOU PAID TO DOWNLOAD THE APP (IF ANY) IN THE TWELVE MONTHS BEFORE THE CLAIM.",
  },
  {
    title: "Indemnity",
    body: "You agree to indemnify and hold harmless the developer from claims arising out of your misuse of the App or your breach of these Terms, to the extent permitted by law.",
  },
  {
    title: "Third-party services",
    body: "The App may rely on platform services (Apple, Google, Expo) for distribution, updates, and diagnostics. Their terms and privacy policies also apply to those services.",
  },
  {
    title: "Changes and termination",
    body: "We may update these Terms or discontinue the App. Continued use after changes means you accept the new Terms. You may stop using the App at any time by uninstalling it.",
  },
  {
    title: "Governing law",
    body: "These Terms are governed by the laws applicable in the developer’s place of establishment, without regard to conflict-of-law rules, except where mandatory consumer protections in your country require otherwise.",
  },
  {
    title: "Contact",
    body: "Questions about these Terms: use the support email on the App Store or Google Play listing for Flux.",
  },
];
