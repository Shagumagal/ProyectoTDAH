import React from "react";
import { useNavigate } from "react-router-dom";
import Captcha from "./components/Captcha";
import { ROUTES } from "../../lib/routes";

export default function CaptchaPage() {
    const nav = useNavigate();

    function handleVerify(isValid: boolean) {
        if (isValid) {
            // Marcar como resuelto en la sesión actual
            sessionStorage.setItem("captcha_solved", "true");
            // Redirigir al home de estudiante
            nav(ROUTES.videojuego, { replace: true });
        }
    }

    return (
        <div className="min-h-dvh w-full bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <h1 className="text-2xl font-bold text-white">Verificación requerida</h1>
                <p className="text-zinc-400">
                    Por favor, completa el desafío para continuar.
                </p>

                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <Captcha onVerify={handleVerify} />
                </div>
            </div>
        </div>
    );
}
