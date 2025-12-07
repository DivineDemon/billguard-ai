import type React from "react";
import { type BillRecord, BillStatus } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface HistoryViewProps {
  history: BillRecord[];
  onViewBill: (bill: BillRecord) => void;
  onDashboardClick: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onViewBill, onDashboardClick }) => {
  const formatCurrency = (amount: number | null | undefined, currency = "PKR") => {
    const val = amount || 0;
    return `${currency || "PKR"} ${val.toLocaleString()}`;
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 font-bold text-2xl">Analysis History</h2>
      {history.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <p className="mb-4 text-muted-foreground">No history found. Upload your first bill!</p>
            <Button variant="link" onClick={onDashboardClick}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <Card
              key={item.id}
              onClick={() => onViewBill(item)}
              className="cursor-pointer transition-colors hover:bg-accent/50"
            >
              <CardContent className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
                <div>
                  <h3 className="font-bold text-lg">{item.hospitalName}</h3>
                  <p className="text-muted-foreground text-sm">
                    {item.dateOfService} • {item.issues.length} Issues Found
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-bold text-lg">{formatCurrency(item.totalAmount, item.currency)}</p>
                  <Badge variant={item.status === BillStatus.CLEAN ? "secondary" : "destructive"}>{item.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
