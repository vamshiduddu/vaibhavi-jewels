import "server-only";
import OpenAI from "openai";

type ProductContentInput = {
  title: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  sku: string | null;
  tags: string[];
  categoryName?: string | null;
  subcategoryName?: string | null;
};

type GeneratedProductContent = {
  instagramCaption: string;
  youtubeTitle: string;
  youtubeDescription: string;
};

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = "thinkingmachines/inkling";

function buildPrompt(input: ProductContentInput): string {
  return [
    "You are writing social media and YouTube marketing copy for Vaibhavi Jewels.",
    "Return strict JSON with keys instagramCaption, youtubeTitle, youtubeDescription.",
    "Tone: premium, elegant, mobile-friendly, conversion-oriented.",
    "Include tasteful hashtags in instagramCaption.",
    "Keep youtubeTitle under 90 characters.",
    `Title: ${input.title}`,
    `Short description: ${input.shortDescription ?? ""}`,
    `Full description: ${input.description ?? ""}`,
    `Price INR: ${input.price}`,
    `SKU: ${input.sku ?? ""}`,
    `Category: ${input.categoryName ?? ""}`,
    `Subcategory: ${input.subcategoryName ?? ""}`,
    `Tags: ${input.tags.join(", ")}`,
  ].join("\n");
}

function parseJsonContent(content: string): GeneratedProductContent | null {
  try {
    return JSON.parse(content) as GeneratedProductContent;
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1)) as GeneratedProductContent;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateProductSocialContent(
  input: ProductContentInput,
): Promise<GeneratedProductContent | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({
    apiKey,
    baseURL: NVIDIA_BASE_URL,
  });

  const response = await openai.chat.completions.create({
    model: NVIDIA_MODEL,
    messages: [{ role: "user", content: buildPrompt(input) }],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 8192,
    stream: false,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) return null;
  return parseJsonContent(content);
}
