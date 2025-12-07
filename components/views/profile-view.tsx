import type React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

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
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="mx-auto w-fit" variant="destructive">
              Clear History & Data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All History?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your billing history and local data from this
                device.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={onClearHistory}>
                  Yes, Delete Everything
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};
