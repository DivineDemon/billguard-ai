import { AlertTriangle, Loader2, Shield, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { HistoryView } from "./components/views/history-view";
import { ProfileView } from "./components/views/profile-view";
import { ResourcesView } from "./components/views/resources-view";
import { ResultsView } from "./components/views/results-view";
// Components
import { UploadConfigDialog } from "./components/views/upload-config-dialog";
import { UploadView } from "./components/views/upload-view";
import { PAKISTAN_INSURERS } from "./constants";
import { BillAnalysisService } from "./services/ai";
import { StorageService } from "./services/storage";
import { type BillRecord, BillStatus, type UserInsuranceInput } from "./types";

type ViewState = "dashboard" | "history" | "resources" | "profile" | "analysis_result";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [history, setHistory] = useState<BillRecord[]>([]);
  const [activeBill, setActiveBill] = useState<BillRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showUploadConfig, setShowUploadConfig] = useState(false);

  // Upload Flow State
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [insuranceInput, setInsuranceInput] = useState<UserInsuranceInput>({
    hasInsurance: false,
    provider: PAKISTAN_INSURERS[0],
    planName: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedBills = StorageService.getBills();
    setHistory(savedBills);
  }, []);

  // Step 1: Handle File Selection
  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPendingFile(base64);
      setShowUploadConfig(true);
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Handle Configuration & Analysis
  const startAnalysis = async () => {
    if (!pendingFile) return;

    setIsAnalyzing(true);
    setError(null);
    setShowUploadConfig(false);
    setCurrentView("dashboard"); // Show loading state on dashboard

    try {
      const analysis = await BillAnalysisService.analyzeBill(pendingFile, insuranceInput);

      const newBill: BillRecord = {
        ...analysis,
        id: Date.now().toString(),
        status: analysis.issues.length > 0 ? BillStatus.ACTION_REQUIRED : BillStatus.CLEAN,
        uploadDate: new Date().toLocaleDateString(),
        rawImage: pendingFile,
        userInsurance: insuranceInput,
      };

      StorageService.saveBill(newBill);
      setHistory((prev) => [newBill, ...prev]);
      setActiveBill(newBill);
      setCurrentView("analysis_result");
    } catch {
      setError("Failed to analyze the bill. Please ensure the image is clear and try again.");
    } finally {
      setIsAnalyzing(false);
      setPendingFile(null);
    }
  };

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    setError(null);
    if (view !== "analysis_result") {
      setActiveBill(null);
    }
  };

  const viewBill = (bill: BillRecord) => {
    setActiveBill(bill);
    setCurrentView("analysis_result");
  };

  const formatCurrency = (amount: number | null | undefined, currency = "PKR") => {
    const val = amount || 0;
    return `${currency || "PKR"} ${val.toLocaleString()}`;
  };

  return (
    <div className="h-screen bg-background text-foreground">
      {/* Zoom Modal */}
      {zoomImage && (
        // biome-ignore lint/a11y/useSemanticElements: Backdrop functions as a container and overlay
        <div
          className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-black/90 p-4"
          role="button"
          tabIndex={0}
          onClick={(e) => e.target === e.currentTarget && setZoomImage(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setZoomImage(null);
          }}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setZoomImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img src={zoomImage} className="max-h-full max-w-full object-contain" alt="Zoomed bill" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 h-16 border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 border-none bg-transparent p-0"
              onClick={() => navigateTo("dashboard")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">BillGuard AI</span>
            </button>
            <nav className="hidden items-center gap-6 font-medium text-sm md:flex">
              <Button
                variant="ghost"
                onClick={() => navigateTo("dashboard")}
                className={currentView === "dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground"}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo("history")}
                className={currentView === "history" ? "bg-primary/10 text-primary" : "text-muted-foreground"}
              >
                History
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo("resources")}
                className={currentView === "resources" ? "bg-primary/10 text-primary" : "text-muted-foreground"}
              >
                Resources
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo("profile")}
                className={currentView === "profile" ? "bg-primary/10 text-primary" : "text-muted-foreground"}
              >
                Profile
              </Button>
              <ModeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto h-[calc(100dvh-165px)] max-w-7xl overflow-y-auto px-4 py-8 sm:px-6 md:h-[calc(100dvh-149px)] lg:px-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-auto text-sm underline">
              Dismiss
            </button>
          </div>
        )}

        <UploadConfigDialog
          open={showUploadConfig}
          onOpenChange={(open) => {
            if (!open) {
              setPendingFile(null);
              setShowUploadConfig(false);
            }
          }}
          insuranceInput={insuranceInput}
          setInsuranceInput={setInsuranceInput}
          onAnalyze={startAnalysis}
          onCancel={() => {
            setPendingFile(null);
            setShowUploadConfig(false);
          }}
        />

        {currentView === "dashboard" && !isAnalyzing && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="h-96 lg:col-span-2">
              <UploadView
                isAnalyzing={isAnalyzing}
                onFileSelect={onFileSelect}
                fileInputRef={fileInputRef}
                onUploadClick={() => fileInputRef.current?.click()}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Recent Analysis</h3>
                <Button variant="link" size="sm" onClick={() => navigateTo("history")}>
                  View All
                </Button>
              </div>
              {history.length === 0 ? (
                <Card className="py-6 text-center">
                  <CardContent>
                    <span className="text-muted-foreground text-sm">No bills in database.</span>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 3).map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => viewBill(item)}
                      className="group cursor-pointer gap-0 p-0 transition-all hover:shadow-md"
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="max-w-[120px] truncate font-medium text-sm">{item.hospitalName}</p>
                          <p className="text-muted-foreground text-xs">{item.dateOfService}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(item.totalAmount, item.currency)}</p>
                          <span
                            className={`text-xs ${
                              item.status === BillStatus.CLEAN ? "text-green-600" : "text-destructive"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="gap-0 border-none bg-primary p-0 text-primary-foreground">
                <CardContent className="p-6">
                  <h4 className="mb-2 font-bold text-lg">Pakistan Insurance</h4>
                  <p className="text-primary-foreground/90 text-sm">
                    Check if your provider (State Life, Jubilee, etc.) covers "Balance Billing". It is often illegal for
                    in-network hospitals to charge you the difference.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex animate-fade-in flex-col items-center justify-center py-20">
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <h2 className="font-bold text-xl">Analyzing Your Bill...</h2>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              Our AI is verifying charges against {insuranceInput.hasInsurance ? insuranceInput.provider : "standard"}{" "}
              rates and checking for coding errors.
            </p>
          </div>
        )}

        {currentView === "analysis_result" && activeBill && (
          <ResultsView bill={activeBill} onDashboardClick={() => navigateTo("dashboard")} onZoomImage={setZoomImage} />
        )}

        {currentView === "history" && (
          <HistoryView history={history} onViewBill={viewBill} onDashboardClick={() => navigateTo("dashboard")} />
        )}
        {currentView === "resources" && <ResourcesView />}
        {currentView === "profile" && (
          <ProfileView
            onClearHistory={() => {
              StorageService.clearDB();
              setHistory([]);
              navigateTo("dashboard");
            }}
          />
        )}
      </main>

      <footer className="mt-auto border-t py-6 text-center text-muted-foreground text-xs">
        <p>BillGuard AI • Pakistan Edition</p>
        <p className="mt-1">
          Disclaimer: Information provided is for educational purposes only. Consult with a legal professional or your
          insurance provider.
        </p>
      </footer>
    </div>
  );
};

export default App;
