import React, { useEffect, useRef } from "react";


type ModalProps = {
open: boolean;
onClose: () => void;
title: string;
children: React.ReactNode;
};


export default function Modal({ open, onClose, title, children }: ModalProps) {
const ref = useRef<HTMLDivElement>(null);


useEffect(() => {
function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
if (open) document.addEventListener("keydown", onKey);
return () => document.removeEventListener("keydown", onKey);
}, [open, onClose]);


useEffect(() => { if (open) ref.current?.focus(); }, [open]);


if (!open) return null;
return (
<div className="fixed inset-0 z-40 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
<div className="absolute inset-0 bg-slate-900/60 backdrop-blur" onClick={onClose} />
<div ref={ref} tabIndex={-1} className="relative z-10 w-full max-w-xl rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
<h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
<button onClick={onClose} className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" aria-label="Cerrar">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6 6 18M6 6l12 12" strokeWidth="2"/></svg>
</button>
</div>
<div className="p-6">{children}</div>
</div>
</div>
);
}