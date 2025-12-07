import type React from "react";
import { PAKISTAN_INSURERS } from "../../constants";
import type { UserInsuranceInput } from "../../types";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface UploadConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insuranceInput: UserInsuranceInput;
  setInsuranceInput: (input: UserInsuranceInput) => void;
  onAnalyze: () => void;
  onCancel: () => void;
}

export const UploadConfigDialog: React.FC<UploadConfigDialogProps> = ({
  open,
  onOpenChange,
  insuranceInput,
  setInsuranceInput,
  onAnalyze,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insurance Details</DialogTitle>
          <DialogDescription>
            Providing your insurance details helps our AI identify illegal "Balance Billing" and coverage errors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasInsurance"
              checked={insuranceInput.hasInsurance}
              onChange={(e) =>
                setInsuranceInput({
                  ...insuranceInput,
                  hasInsurance: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="hasInsurance" className="cursor-pointer">
              I have Health Insurance
            </Label>
          </div>

          {insuranceInput.hasInsurance && (
            <div className="animate-fade-in space-y-4 border-primary/20 border-l-2 pl-6">
              <div className="space-y-2">
                <Label>Insurance Company</Label>
                <Select
                  value={insuranceInput.provider}
                  onValueChange={(val) => setInsuranceInput({ ...insuranceInput, provider: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAKISTAN_INSURERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan Name / Policy Type</Label>
                <Input
                  type="text"
                  placeholder="e.g. Gold Plan, Corporate"
                  value={insuranceInput.planName}
                  onChange={(e) =>
                    setInsuranceInput({
                      ...insuranceInput,
                      planName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onAnalyze}>Analyze Bill</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
