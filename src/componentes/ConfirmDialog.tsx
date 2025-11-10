import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  /** color del botón de confirmar */
  intent?: "default" | "danger" | "success";
  /** contenido adicional (p.ej., lista de cambios) */
  children?: React.ReactNode;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  onClose,
  onConfirm,
  intent = "default",
  children,
}: Props) {
  const color: "primary" | "error" | "success" =
    intent === "danger" ? "error" : intent === "success" ? "success" : "primary";

  const hasContent = Boolean(description) || Boolean(children);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown={loading}
    >
      <DialogTitle id="confirm-title">{title}</DialogTitle>

      {hasContent && (
        <DialogContent>
          {description && (
            <DialogContentText id="confirm-desc" sx={{ whiteSpace: "pre-line", mb: children ? 1 : 0 }}>
              {description}
            </DialogContentText>
          )}
          {children}
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={color}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
