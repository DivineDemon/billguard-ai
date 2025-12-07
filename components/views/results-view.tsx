import { AlertTriangle, CheckCircle, ChevronLeft, Copy, Loader2, MapPin, Search, ZoomIn } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { BillAnalysisService } from "../../services/ai";
import { type BillRecord, BillStatus, type DisputeGuide } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface ResultsViewProps {
  bill: BillRecord;
  onDashboardClick: () => void;
  onZoomImage: (image: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ bill, onDashboardClick, onZoomImage }) => {
  const [isGeneratingDispute, setIsGeneratingDispute] = useState(false);
  const [disputeData, setDisputeData] = useState<DisputeGuide | null>(null);

  const totalPotentialSavings = bill.issues.reduce((acc, issue) => acc + (issue.estimatedOvercharge || 0), 0);

  const patientPays =
    bill.insurance.patientResponsibility !== null && bill.insurance.patientResponsibility !== undefined
      ? bill.insurance.patientResponsibility
      : bill.totalAmount;

  const handleGenerateDispute = async () => {
    setIsGeneratingDispute(true);
    try {
      const guide = await BillAnalysisService.generateDisputeGuide(bill);
      setDisputeData(guide);
    } catch {
      // Could accept an onError prop if global error handling is needed
    } finally {
      setIsGeneratingDispute(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const formatCurrency = (amount: number | null | undefined, currency = "PKR") => {
    const val = amount || 0;
    return `${currency || "PKR"} ${val.toLocaleString()}`;
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <Button variant="ghost" onClick={onDashboardClick} className="pl-0 transition-all hover:pl-2">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{bill.hospitalName}</CardTitle>
                  <div className="mt-2 flex items-center gap-3 text-muted-foreground text-sm">
                    <span>{bill.dateOfService}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {bill.locale}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={bill.status === BillStatus.ACTION_REQUIRED ? "destructive" : "secondary"}
                  className="px-3 py-1 text-sm"
                >
                  {bill.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4 text-muted-foreground italic">"{bill.summary}"</div>

              <div className="rounded-r-lg border-primary border-l-4 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-primary text-sm">
                  <Search className="h-4 w-4" /> AI Verification Process
                </h4>
                <ul className="list-inside list-disc space-y-1 text-primary text-sm">
                  {bill.verificationMethodology && bill.verificationMethodology.length > 0 ? (
                    bill.verificationMethodology.map((step) => <li key={step}>{step}</li>)
                  ) : (
                    <li>Verified against standard medical billing formats and coding rules.</li>
                  )}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Identified Issues ({bill.issues.length})
                </h3>

                {bill.issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-green-100 bg-green-50 p-8 text-green-700">
                    <CheckCircle className="mb-2 h-8 w-8" />
                    <p>No obvious billing errors found.</p>
                  </div>
                ) : (
                  bill.issues.map((issue) => (
                    <Card
                      key={issue.title}
                      className="gap-0 border-l-4 border-l-destructive bg-card p-0 transition-colors hover:bg-destructive/5"
                    >
                      <CardContent className="p-4">
                        <div className="mb-2 flex justify-between">
                          <span className="font-medium">{issue.title}</span>
                          <span className="font-bold text-destructive">
                            ~{formatCurrency(issue.estimatedOvercharge, bill.currency)}
                          </span>
                        </div>
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline">{issue.category}</Badge>
                          <Badge variant={issue.severity === "High" ? "destructive" : "secondary"}>
                            {issue.severity} Severity
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{issue.description}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {bill.issues.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Take Action</CardTitle>
                  {isGeneratingDispute && (
                    <span className="animate-pulse text-primary text-sm">Generating strategy...</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!disputeData ? (
                  <div className="py-6 text-center">
                    <p className="mb-6 text-muted-foreground">
                      Ready to dispute? Our AI can draft a letter to{" "}
                      {bill.insurance.status !== "Not Found" ? "your insurance and hospital" : "the hospital"}.
                    </p>
                    <Button onClick={handleGenerateDispute} disabled={isGeneratingDispute} className="w-full md:w-auto">
                      {isGeneratingDispute ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Drafting Letter...
                        </>
                      ) : (
                        "Generate Dispute Letter"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-primary bg-primary/10 p-4">
                      <h4 className="mb-2 font-semibold text-primary">Next Steps</h4>
                      <ul className="list-inside list-disc space-y-1 text-primary text-sm">
                        {disputeData.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Draft Letter</Label>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(disputeData.letter)}>
                          <Copy className="mr-1 h-4 w-4" /> Copy Text
                        </Button>
                      </div>
                      <Textarea readOnly className="h-96" value={disputeData.letter} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 md:col-span-1">
          <Card className="gap-0 border-none bg-gradient-to-br from-primary to-primary/80 p-0 text-primary-foreground">
            <CardContent className="p-6">
              <p className="mb-1 font-semibold text-primary-foreground/80 text-sm uppercase tracking-wider">
                Total Savings Found
              </p>
              <p className="font-bold text-4xl">{formatCurrency(totalPotentialSavings, bill.currency)}</p>
              <p className="mt-2 text-primary-foreground/80 text-xs">across {bill.issues.length} flagged items</p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="text-lg">Bill Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between border-b py-2 text-sm">
                <span className="text-muted-foreground">Total Billed</span>
                <span className="font-medium">{formatCurrency(bill.totalAmount, bill.currency)}</span>
              </div>
              {bill.insurance.coveredAmount !== null && bill.insurance.coveredAmount > 0 && (
                <div className="flex justify-between border-b py-2 text-green-600 text-sm">
                  <span>Insurance Covers</span>
                  <span className="font-medium">-{formatCurrency(bill.insurance.coveredAmount, bill.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-base">
                <span className="font-bold">Patient Pays</span>
                <span className="font-bold">{formatCurrency(patientPays, bill.currency)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Original Document</CardTitle>
                <Button variant="link" size="sm" onClick={() => onZoomImage(bill.rawImage)} className="h-auto p-0">
                  <ZoomIn className="mr-1 h-4 w-4" /> Full Screen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                className="group relative flex h-64 w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border bg-muted p-0"
                onClick={() => onZoomImage(bill.rawImage)}
              >
                <img src={bill.rawImage} alt="Bill" className="h-full w-full object-contain" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10">
                  <Badge variant="secondary" className="pointer-events-none opacity-0 group-hover:opacity-100">
                    Click to zoom
                  </Badge>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
