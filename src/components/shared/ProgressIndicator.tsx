"use client";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-slate-400 text-center">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
};

export default ProgressIndicator;
