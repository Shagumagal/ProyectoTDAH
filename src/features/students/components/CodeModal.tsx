// src/features/students/components/CodeModal.tsx
import { useEffect, useState } from "react";
import Modal from "../../../componentes/Modal";

interface CodeModalProps {
  open: boolean;
  onClose: () => void;
  code: string;
  username: string;
  expiresInMinutes: number;
}

export default function CodeModal({ open, onClose, code, username, expiresInMinutes }: CodeModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Código de Acceso - ${username}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1e293b;
              margin: 0 0 10px 0;
            }
            .header p {
              color: #64748b;
              margin: 0;
            }
            .info-box {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 25px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 15px 0;
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #475569;
            }
            .value {
              color: #1e293b;
              font-weight: 500;
            }
            .code-display {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 16px;
              text-align: center;
              margin: 25px 0;
              box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
            }
            .code-label {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
              opacity: 0.9;
            }
            .code-value {
              font-size: 48px;
              font-weight: 800;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .instructions {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .instructions h3 {
              color: #92400e;
              margin: 0 0 15px 0;
              font-size: 16px;
            }
            .instructions ol {
              margin: 0;
              padding-left: 20px;
              color: #78350f;
            }
            .instructions li {
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 14px;
            }
            .warning {
              background: #fee2e2;
              border: 2px solid #fca5a5;
              color: #991b1b;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              font-size: 14px;
              font-weight: 600;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎓 Código de Acceso Temporal</h1>
            <p>Sistema de Evaluación TDAH</p>
          </div>

          <div class="info-box">
            <div class="info-row">
              <span class="label">👤 Alumno:</span>
              <span class="value">${username}</span>
            </div>
            <div class="info-row">
              <span class="label">⏱️ Válido por:</span>
              <span class="value">${expiresInMinutes} minutos</span>
            </div>
            <div class="info-row">
              <span class="label">📅 Generado:</span>
              <span class="value">${new Date().toLocaleString('es-ES')}</span>
            </div>
          </div>

          <div class="code-display">
            <div class="code-label">Tu código de acceso es:</div>
            <div class="code-value">${code}</div>
          </div>

          <div class="warning">
            ⚠️ Este código es de un solo uso y expira en ${expiresInMinutes} minutos
          </div>

          <div class="instructions">
            <h3>📋 Instrucciones de uso:</h3>
            <ol>
              <li>Ve a la página de inicio de sesión</li>
              <li>Selecciona la opción "Ingresar con código"</li>
              <li>Escribe tu usuario: <strong>${username}</strong></li>
              <li>Ingresa este código de 6 dígitos</li>
              <li>El sistema te pedirá crear una nueva contraseña</li>
            </ol>
          </div>

          <div class="footer">
            <p>Si tienes problemas, contacta a tu docente o administrador</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Modal open={open} onClose={onClose} title="Código de Acceso Generado">
      <div className="space-y-6">
        {/* Info del alumno */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👤</span>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Usuario del alumno</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{username}</div>
            </div>
          </div>
        </div>

        {/* Código */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-center shadow-2xl">
          <div className="text-white/90 text-sm uppercase tracking-wider mb-3">
            Código de Acceso Temporal
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
            <div className="text-white text-5xl font-black tracking-[0.3em] font-mono">
              {code}
            </div>
          </div>
          <div className="text-white/80 text-xs">
            ⏱️ Válido por {expiresInMinutes} minutos
          </div>
        </div>

        {/* Advertencia */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Importante:</p>
              <ul className="space-y-1 text-xs">
                <li>• Este código es de <strong>un solo uso</strong></li>
                <li>• Expira en <strong>{expiresInMinutes} minutos</strong></li>
                <li>• Al usarlo, el alumno deberá crear una nueva contraseña</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <span>📋</span> Instrucciones para el alumno
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
            <li>Ir a la página de inicio de sesión</li>
            <li>Seleccionar "Ingresar con código"</li>
            <li>Escribir el usuario: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded font-mono">{username}</code></li>
            <li>Ingresar el código de 6 dígitos</li>
            <li>Crear una nueva contraseña cuando se solicite</li>
          </ol>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-xl px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Copiado</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copiar código</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl px-4 py-3 bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>🖨️</span>
            <span>Imprimir</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-all"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
