import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "th" : "en"
    i18n.changeLanguage(newLang)
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className="w-12 font-bold">
      {i18n.language === "en" ? "TH" : "EN"}
    </Button>
  )
}
