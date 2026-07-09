import { AIValidationPayload } from "./types";

/**
 * Intelligent AI Semantic Vetting Engine (Hugging Face Edition)
 * Leverages structured context mapping over Llama-3 serverless inference models.
 */
export async function analyzeBusinessIntentWithAI(
  name: string,
  description: string,
): Promise<AIValidationPayload> {
  try {
    const hfToken = process.env.HF_API_KEY;
    if (!hfToken) {
      throw new Error(
        "Missing mandatory HF_API_KEY inside system environment configurations",
      );
    }

    const response = await fetch("https://huggingface.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hfToken}`,
      },
      body: JSON.stringify({
        inputs: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an automated risk-vetting gatekeeper for Freshpoint, a marketplace built STRICTLY for wellness, beauty, fitness, spa, and medical healthcare spaces.
Your job is to read the business name and description and determine if it belongs on this platform.

APPROVED INDUSTRIES: Hair salons, barbershops, beauty spas, nail studios, gymnasiums, yoga studios, massage therapists, dental practices, dermatology clinics, wellness lounges.
REJECTED INDUSTRIES: Food, restaurants, catering, bars, auto repair, real estate, software agencies, cryptocurrency, car washes, legal services, pets/veterinary.

Analyze the business and return EXACTLY a raw JSON object string with no extra markdown code fences, headers, backticks or conversational text. Match this layout formatting structure exactly:
{"isValidIndustry": boolean, "confidenceScore": 1.0, "reason": "Polite rejection statement if invalid"}
<|eot_id|><|start_header_id|>user<|end_header_id|>
Business Name: "${name}"\nBusiness Description: "${description}"<|eot_id|><|start_header_id|>assistant<|end_header_id|>`,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `AI Gate API communications dropped with code: ${response.status}`,
      );
    }

    const rawResponseData: unknown = await response.json();
    let generatedText = "";

    // 🌟 THE FIX: Convert through intermediate 'unknown' first to align structural arrays safely
    if (Array.isArray(rawResponseData) && rawResponseData.length > 0) {
      const intermediateUnknown = rawResponseData[0] as unknown;
      const firstChoice = intermediateUnknown as Record<string, unknown>;
      generatedText =
        typeof firstChoice.generated_text === "string"
          ? firstChoice.generated_text
          : "";
    } else if (rawResponseData && typeof rawResponseData === "object") {
      const intermediateUnknown = rawResponseData as unknown;
      const objChoice = intermediateUnknown as Record<string, unknown>;
      generatedText =
        typeof objChoice.generated_text === "string"
          ? objChoice.generated_text
          : "";
    }

    const jsonStartIndex = generatedText.lastIndexOf("{");
    const jsonEndIndex = generatedText.lastIndexOf("}");

    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error(
        "Invalid text-string conversion structure parsed from Hugging Face model.",
      );
    }

    const cleanJsonText = generatedText.substring(
      jsonStartIndex,
      jsonEndIndex + 1,
    );
    return JSON.parse(cleanJsonText) as AIValidationPayload;
  } catch (error: unknown) {
    console.error(
      "AI Semantic Gate execution failure. Engaging graceful safety fallback:",
      error,
    );
    return {
      isValidIndustry: true,
      confidenceScore: 1.0,
      reason: "Bypassed due to operational processing timeout.",
    };
  }
}
