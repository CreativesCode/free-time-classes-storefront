"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  variant?: "default" | "destructive";
  contentClassName?: string;
};

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  variant = "destructive",
  contentClassName = "sm:max-w-[520px]",
}: ConfirmActionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && onCancel) {
          onCancel();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        data-theme="freetime"
        className={cn(
          "w-[calc(100%-2rem)] max-w-[620px] overflow-y-auto overscroll-contain rounded-ft-2xl border border-ft-line bg-ft-paper p-0 text-ft-ink shadow-[0_30px_60px_-15px_rgba(45,36,26,0.20)]",
          "[&>button]:top-5 [&>button]:right-5 [&>button]:text-ft-ink-3 [&>button]:opacity-100 [&>button]:hover:text-ft-ink",
          contentClassName
        )}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-red-500 to-red-300/70" />

        <DialogHeader className="px-5 pb-0 pt-8 text-center sm:px-8">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ft-paper text-red-600 shadow-sm ring-1 ring-red-100">
              <AlertTriangle className="h-7 w-7" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-ft-ink">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mx-auto mt-2 max-w-[50ch] text-sm leading-relaxed text-ft-ink-2">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="px-5 pb-0 pt-6 sm:px-8">
          <div className="flex items-start gap-3 rounded-ft-lg bg-ft-surface-1 p-4 text-left">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-ft-accent-deep" />
            <p className="text-sm font-medium text-ft-ink-2">
              Esta accion no se puede deshacer. Verifica antes de confirmar.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 px-5 pb-4 pt-6 sm:flex-row-reverse sm:justify-start sm:px-8 sm:pb-6">
          <Button
            type="button"
            variant={variant}
            disabled={loading}
            onClick={onConfirm}
            className="h-12 w-full rounded-ft-md text-sm font-semibold shadow-none sm:flex-1"
          >
            <Trash2 className="h-4 w-4" />
            {confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="h-12 w-full rounded-ft-md border-ft-line bg-ft-paper text-ft-ink-2 shadow-none hover:bg-ft-surface-1 hover:text-ft-ink sm:flex-1"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            {cancelLabel}
          </Button>
        </DialogFooter>

        <div className="pb-6 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ft-ink-3">
            FreeTime Security Protocol
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
