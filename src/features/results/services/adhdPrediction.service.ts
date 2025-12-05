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
        throw new Error(errorText || "Error fetching AI analysis");
    }

    const data = await res.json();
    return data.prediction;
}


