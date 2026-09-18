"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface SimulatedPurchaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  price: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * A presentational stand-in for Apple's native StoreKit purchase sheet.
 *
 * StoreKit does not exist in a web browser, so this component is what
 * renders in the web preview whenever a purchase flow would otherwise
 * call the real native purchase API. It deliberately looks similar to
 * the real iOS confirmation sheet, but is clearly labeled as a preview
 * simulation so nobody mistakes it for an actual charge.
 *
 * Usage pattern: gate on Capacitor.isNativePlatform() in the calling
 * code -- render this component on the `false` (web) branch, and call
 * the real StoreKit purchase API on the `true` (native) branch.
 */
const SimulatedPurchaseSheet = ({
  open,
  onOpenChange,
  productName,
  price,
  onConfirm,
  onCancel,
}: SimulatedPurchaseSheetProps) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        <div className="border-b bg-muted/50 px-4 py-2 text-center text-xs font-medium text-muted-foreground">
          Preview Mode — Simulated Purchase
        </div>

        <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
          <DialogHeader className="items-center gap-1 text-center">
            <DialogTitle className="text-base">{productName}</DialogTitle>
            <DialogDescription className="text-sm">
              {price}
            </DialogDescription>
          </DialogHeader>

          <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
            This is a fake in-app purchase popup for preview purposes only —
            no real payment is being made. Running this app through Xcode on
            a device will show Apple's actual purchase screen here instead.
          </p>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-0 border-t sm:space-x-0">
          <Button
            variant="ghost"
            className="h-12 rounded-none border-r"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            className="h-12 rounded-none font-semibold"
            onClick={handleConfirm}
          >
            Buy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { SimulatedPurchaseSheet };
