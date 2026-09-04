import { LegalDocumentScreen } from "@/components/LegalDocumentScreen";
import { PRIVACY_SECTIONS } from "@/src/lib/legalContent";

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen title="Privacy policy" sections={PRIVACY_SECTIONS} />
  );
}
