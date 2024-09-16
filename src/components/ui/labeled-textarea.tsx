import { Label } from "@/components/ui/label";
import { FC } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Textarea } from "./textarea";

export const LabelTextArea: FC<{
    label: string;
    required?: boolean;
    tooltip: string;
    disabled?: boolean;
    value?: number | string;
    id: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}> = ({
    label,
    required,
    tooltip,
    disabled,
    value,
    onChange,
    id,
}) => {
        return (
            <div className="flex flex-col items-start item-center space-y-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Label htmlFor={id}>
                                {label} {required ? "" : "(optional)"}
                            </Label></TooltipTrigger>
                        <TooltipContent className="ml-16 mb-4">
                            <p>{tooltip}</p>
                        </TooltipContent>

                    </Tooltip>
                    <Textarea
                        disabled={disabled}
                        id={id}
                        value={value}
                        onChange={onChange}
                    />
                </TooltipProvider>
            </div>
        );
    };
