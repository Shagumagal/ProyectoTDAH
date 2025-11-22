import React, { createContext, useContext, useState, useCallback } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert, { type AlertColor } from "@mui/material/Alert";

type NotificationType = AlertColor; // "success" | "info" | "warning" | "error"

interface NotificationContextValue {
    showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return ctx;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<NotificationType>("info");

    const showNotification = useCallback((msg: string, type: NotificationType = "info") => {
        setMessage(msg);
        setSeverity(type);
        setOpen(true);
    }, []);

    const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={handleClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={handleClose} severity={severity} variant="outlined" sx={{ width: "100%", bgcolor: 'background.paper' }}>
                    {message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
}
