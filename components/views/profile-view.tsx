import type React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface ProfileViewProps {
  onClearHistory: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onClearHistory }) => {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="gap-0 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <span className="text-2xl">👤</span>
        </div>
        <h2 className="font-bold text-xl">Guest User</h2>
        <p className="mb-6 text-muted-foreground">Data is stored locally on this device.</p>
        <Button
          size="lg"
          className="mx-auto w-fit"
          variant="destructive"
          onClick={() => {
            if (confirm("Are you sure you want to clear your history?")) {
              onClearHistory();
            }
          }}
        >
          Clear History & Data
        </Button>
      </Card>
    </div>
  );
};
