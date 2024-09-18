import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FC } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export const LabeledInput: FC<{
  label: string;
  required?: boolean;
  tooltip: string;
  disabled?: boolean;
  value?: number | string;
  type?: "number" | "text";
  id: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({
  label,
  required,
  tooltip,
  disabled,
  value,
  onChange,
  id,
  type = "number",
}) => {
    return (
      <div className="flex flex-col items-start item-center space-y-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Label htmlFor={id}>
                {label} {required ? "" : "(optional)"}
              </Label>
            </TooltipTrigger>
            <TooltipContent className="ml-16 mb-4">
              <p>{tooltip}</p>
            </TooltipContent>

          </Tooltip>
          <Input
            disabled={disabled}
            type={type}
            id={id}
            value={value}
            onChange={onChange}
          />
        </TooltipProvider>
      </div>
    );
  };
