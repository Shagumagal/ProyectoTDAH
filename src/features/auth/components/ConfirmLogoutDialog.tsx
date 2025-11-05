import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

export default function ConfirmLogoutDialog({
  open,
  onConfirm,
  onClose,
  loading,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="logout-title"
      fullWidth
      maxWidth="xs"
      keepMounted
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(2,6,23,.6)" } }, // fondo oscuro
      }}
      sx={{
        "& .MuiPaper-root": {
          borderRadius: 12,
          bgcolor: "rgb(2,6,23)", // slate-950
          color: "#fff",
          border: "1px solid rgba(148,163,184,.25)", // slate-400/25
        },
      }}
    >
      <DialogTitle id="logout-title" sx={{ fontWeight: 800 }}>
        Cerrar sesión
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ opacity: 0.9 }}>
          ¿Estás seguro de que quieres cerrar sesión?
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5, color: "rgba(255,255,255,.7)" }}>
          Si tienes cambios sin guardar, podrías perderlos.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderColor: "rgba(148,163,184,.35)",
            color: "#e2e8f0",
            ":hover": { borderColor: "#94a3b8", background: "rgba(148,163,184,.08)" },
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          sx={{ textTransform: "none", fontWeight: 800, px: 2.5 }}
        >
          {loading ? "Cerrando…" : "Cerrar sesión"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
