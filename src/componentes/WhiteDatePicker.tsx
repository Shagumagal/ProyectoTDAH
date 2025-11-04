import * as React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField } from "@mui/material"; // Keep TextField import for typing if needed, but not passed to slots directly.

type DPProps = React.ComponentProps<typeof DatePicker<any>>;
type Props = Omit<DPProps, "slotProps"> & { slotProps?: DPProps["slotProps"] };

const merge = (a?: any, b?: any) => ({ ...(a || {}), ...(b || {}) });

export default function WhiteDatePicker({ slotProps, ...rest }: Props) {
  const textFieldProps = merge(
    {
      variant: "outlined",
      fullWidth: true,
      placeholder: "dd/mm/aaaa",
      InputProps: {
        sx: {
          // Fondo y bordes
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,.6)" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
          backgroundColor: "rgba(15,23,42,.35)",
          borderRadius: "12px",

          // Texto y placeholder
          "& .MuiInputBase-input, & .MuiOutlinedInput-input": {
            color: "#fff !important",
            WebkitTextFillColor: "#fff",
          },
          "& input::placeholder, & .MuiInputBase-input::placeholder": {
            color: "rgba(255,255,255,.7) !important",
            opacity: 1,
          },

          // Ícono calendario
          "& .MuiSvgIcon-root": { color: "#fff" },

          // Autofill
          "& input:-webkit-autofill": {
            WebkitTextFillColor: "#fff",
            WebkitBoxShadow: "0 0 0 1000px rgba(15,23,42,.35) inset",
          },
        },
      },
      FormHelperTextProps: {
        sx: { color: "#cbd5e1" },
      },
      sx: {
        "& .MuiFormLabel-root": { color: "rgba(255,255,255,.85)" },
        "& .MuiFormLabel-root.Mui-focused": { color: "#fff" },
      },
    },
    (slotProps as any)?.textField // Use textField for TextFiel-specific props
  );

  const popper = merge(
    {
      sx: {
        zIndex: 2100, // por encima del modal Tailwind (z-50)
        "& .MuiPaper-root": { backgroundColor: "#0f172a", color: "#fff" },
        "& .MuiPickersDay-root": { color: "#fff" },
        "& .MuiPickersDay-root.Mui-selected": { backgroundColor: "#6366f1", color: "#fff" },
        "& .MuiPickersCalendarHeader-label": { color: "#fff" },
        "& .MuiIconButton-root": { color: "#fff" },
        "& .MuiDayCalendar-weekDayLabel": { opacity: 0.85 },
        "& .MuiPickersDay-dayOutsideMonth, & .Mui-disabled": { opacity: 0.4 },
      },
      // IMPORTANTE: que renderice en body para no quedar "debajo" del overlay
      disablePortal: false,
    },
    (slotProps as any)?.popper
  );

  return (
    <DatePicker
      {...rest}
      // No need to specify slots={{ field: TextField }} if we are customizing the default TextField
      slotProps={{ ...slotProps, textField: textFieldProps, popper }}
    />
  );
}