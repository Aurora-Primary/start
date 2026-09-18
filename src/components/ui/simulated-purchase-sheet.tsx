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
import { cn } from "@/lib/utils";

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
  const [iconFailed, setIconFailed] = React.useState(false);
  const [iconSize, setIconSize] = React.useState(56);
  const textBlockRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!open) return;
    const el = textBlockRef.current;
    if (!el) return;
    setIconSize(el.offsetHeight);
  }, [open, productName, price]);

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const iconStyle = { height: iconSize, width: iconSize };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "top-auto bottom-6 w-[calc(100%-2rem)] max-w-sm translate-y-0 gap-0 overflow-hidden rounded-3xl p-0 shadow-lg sm:rounded-3xl",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
          "duration-300 data-[state=closed]:duration-200",
          "[&>button]:hidden",
        )}
      >
        <div className="border-b bg-muted/50 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
          Preview Mode — Simulated Purchase
        </div>

        <div className="flex flex-col gap-4 px-5 pb-1 pt-4">
          <div className="flex items-center gap-3">
            {iconFailed ? (
              <div
                aria-hidden="true"
                className="shrink-0 overflow-hidden rounded-[11px] bg-muted shadow-sm"
                style={iconStyle}
              />
            ) : (
              <div
                className="shrink-0 overflow-hidden rounded-[11px] shadow-sm"
                style={iconStyle}
              >
                <img
                  src="/apple-touch-icon.png"
                  alt=""
                  aria-hidden="true"
                  className="size-full rounded-[11px] object-cover"
                  onError={() => setIconFailed(true)}
                />
              </div>
            )}

            <div ref={textBlockRef} className="min-w-0 flex-1">
              <DialogHeader className="justify-center space-y-0 text-left sm:text-left">
                <DialogTitle className="text-base leading-tight">{productName}</DialogTitle>
                <p className="-mt-0.5 text-xs font-medium leading-tight text-muted-foreground">
                  Your App
                </p>
                <DialogDescription className="pt-1 text-sm font-medium leading-tight text-foreground">
                  {price}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            This is a fake in-app purchase popup for preview purposes only —
            no real payment is being made. Running this app through Xcode on
            a device will show Apple's actual purchase screen here instead.
          </p>
        </div>

        <DialogFooter className="flex flex-col gap-1 px-5 pb-4 pt-3 sm:flex-col sm:space-x-0">
          <Button
            className="h-11 w-full rounded-xl bg-black font-semibold text-white hover:bg-black/90"
            onClick={handleConfirm}
          >
            Buy
          </Button>
          <Button variant="ghost" className="h-10 w-full rounded-xl" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { SimulatedPurchaseSheet };
