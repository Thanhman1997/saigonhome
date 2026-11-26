import { generateText, gateway } from "ai"

export type ReviewLanguage = "en" | "vi" | "ko"

export async function translateReview(text: string, source: ReviewLanguage) {
  const targets = (["en", "vi", "ko"] as ReviewLanguage[]).filter((language) => language !== source)
  const prompt = `Translate this customer review from ${source} into ${targets.join(" and ")}. Return ONLY valid JSON with keys ${targets.join(", ")}. Preserve tone and meaning. Review: ${JSON.stringify(text)}`
  const result = await generateText({ model: gateway("openai/gpt-4.1-mini"), prompt })
  const parsed = JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as Record<string, string>
  return { en: source === "en" ? text : parsed.en ?? text, vi: source === "vi" ? text : parsed.vi ?? text, ko: source === "ko" ? text : parsed.ko ?? text }
}
