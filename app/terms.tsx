import { LegalDocumentScreen } from "@/components/LegalDocumentScreen";
import { TERMS_SECTIONS } from "@/src/lib/legalContent";

export default function TermsScreen() {
  return (
    <LegalDocumentScreen title="Terms & Conditions" sections={TERMS_SECTIONS} />
  );
}
