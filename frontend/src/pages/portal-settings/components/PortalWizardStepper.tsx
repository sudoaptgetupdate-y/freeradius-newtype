import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PortalWizardStepperProps {
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  saving?: boolean
  handleSave?: () => void
}

export function PortalWizardStepper({
  currentStep,
  setCurrentStep,
}: PortalWizardStepperProps) {
  return (
    <>
      {/* Wizard Progress Stepper Indicator */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Step 1 */}
          <button 
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex flex-col items-center gap-2 relative z-10 transition-colors ${
              currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
              currentStep >= 1 ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110' : 'bg-background border-muted text-muted-foreground'
            }`}>
              1
            </div>
            <span className="text-xs font-medium whitespace-nowrap">Basic Info</span>
          </button>

          {/* Line 1-2 */}
          <div className={`flex-1 h-[2px] transition-colors ${currentStep >= 2 ? 'bg-primary' : 'bg-border'}`} />

          {/* Step 2 */}
          <button 
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex flex-col items-center gap-2 relative z-10 transition-colors ${
              currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
              currentStep >= 2 ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110' : 'bg-background border-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className="text-xs font-medium whitespace-nowrap">Design</span>
          </button>

          {/* Line 2-3 */}
          <div className={`flex-1 h-[2px] transition-colors ${currentStep >= 3 ? 'bg-primary' : 'bg-border'}`} />

          {/* Step 3 */}
          <button 
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex flex-col items-center gap-2 relative z-10 transition-colors ${
              currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
              currentStep >= 3 ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110' : 'bg-background border-muted text-muted-foreground'
            }`}>
              3
            </div>
            <span className="text-xs font-medium whitespace-nowrap">Terms</span>
          </button>
        </div>
      </div>
    </>
  )
}

export function PortalWizardActions({
  currentStep,
  setCurrentStep,
  saving,
  handleSave,
}: PortalWizardStepperProps) {
  return (
    <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-sm mt-6">
      <Button
        variant="outline"
        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
        disabled={currentStep === 1}
        className="flex items-center gap-1.5"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="flex gap-2">
        {currentStep < 3 ? (
          <Button 
            onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
            className="flex items-center gap-1.5"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        )}
      </div>
    </div>
  )
}
