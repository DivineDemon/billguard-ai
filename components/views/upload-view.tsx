import { Loader2, Upload } from "lucide-react";
import type React from "react";
import type { RefObject } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface UploadViewProps {
  isAnalyzing: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onUploadClick: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ isAnalyzing, onFileSelect, fileInputRef, onUploadClick }) => {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-0 border-dashed p-0 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10 p-4 text-primary">
        <Upload className="size-full" />
      </div>
      <h2 className="mb-2 font-bold text-2xl">Upload Hospital Bill</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Upload a scan of your bill. Our AI works with hospital bills from <strong>Pakistan</strong> and international
        providers.
      </p>

      <Button size="lg" onClick={onUploadClick} disabled={isAnalyzing} className="h-14 px-8 text-lg shadow-lg">
        {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
        {isAnalyzing ? "Analyzing Bill..." : "Select Bill Image"}
      </Button>
      <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*" className="hidden" />
      <p className="mt-4 text-muted-foreground text-xs">Supported formats: JPG, PNG</p>
    </Card>
  );
};
