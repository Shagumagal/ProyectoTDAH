import { API_URL, authHeaders } from "../../../lib/http";

export interface InputFeatures {
    [key: string]: number | undefined;
}

export async function getADHDAnalysis(studentId: string): Promise<number> {
    const res = await fetch(`${API_URL}/api/ai-analysis/predict`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ studentId }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        try {
            const parsed = JSON.parse(errorText) as { error?: string };
            if (parsed?.error) throw new Error(parsed.error);
        } catch (e) {
            if (e instanceof Error && e.message !== errorText && !e.message.startsWith("Unexpected")) {
                throw e;
            }
        }
        throw new Error(errorText || "Error al obtener el análisis de IA");
    }

    const data = await res.json();
    return data.prediction;
}
