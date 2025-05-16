import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div
      className={cn("flex items-center justify-center w-full my-4", className)}
    >
      {steps.map((step, index) => {
        const isCompleted = currentStep > index + 1;
        const isCurrent = currentStep === index + 1;

        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                {
                  "border-primary bg-primary text-primary-foreground":
                    isCurrent || isCompleted,
                  "border-muted-foreground text-muted-foreground":
                    !isCurrent && !isCompleted,
                }
              )}
            >
              {isCompleted ? (
                <svg
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 16 12"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5.917 5.724 10.5 15 1.5"
                  />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn("w-20 h-0.5 mx-2 transition-colors", {
                  "bg-primary": isCompleted,
                  "bg-muted-foreground": !isCompleted,
                })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
