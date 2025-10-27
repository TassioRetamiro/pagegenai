
import { GoogleGenAI, Type } from "@google/genai";
import { Language, PageType, GeneratedPages, GeneratedAdCreative } from '../types';

interface GenerationParams {
  affiliateLink: string;
  vslLink?: string;
  productInfo: string;
  language: Language;
  productImage?: string; // base64
  productImageUrl?: string; // url
  tofuLinkSource: 'main' | 'vsl';
}

interface GenerationResult {
    pages: GeneratedPages;
    adCreative: GeneratedAdCreative;
}

const createGeminiPrompt = (params: GenerationParams): string => {
  const finalAffiliateLink = params.affiliateLink;
  
  let tofuCtaLink = finalAffiliateLink;
  if (params.tofuLinkSource === 'vsl' && params.vslLink) {
    tofuCtaLink = params.vslLink;
  }

  let mofuBofuImageInstruction = '';
  if (params.productImage) {
    mofuBofuImageInstruction = `
    **PRODUCT IMAGE (Step 1.5 - For MOFU & BOFU Pages):**
    A product image has been provided by the user (via upload). You MUST use this specific image in the MOFU and BOFU pages.
    - **Image Data:** This is a base64 encoded image. To display it, use the HTML syntax: \`<img src="data:image/jpeg;base64,${params.productImage}" alt="[Product Name]">\`. Replace "[Product Name]" with the actual product name you extract.
    - **Placement:** Place the image prominently on both MOFU and BOFU pages, near the main headline or primary call-to-action.
    `;
  } else if (params.productImageUrl) {
    mofuBofuImageInstruction = `
    **PRODUCT IMAGE (Step 1.5 - For MOFU & BOFU Pages):**
    A product image has been provided by the user (via URL). You MUST use this specific image in the MOFU and BOFU pages.
    - **Image URL:** To display it, use the HTML syntax: \`<img src="${params.productImageUrl}" alt="[Product Name]">\`. Replace "[Product Name]" with the actual product name you extract.
    - **Placement:** Place the image prominently on both MOFU and BOFU pages, near the main headline or primary call-to-action.
    `;
  } else {
    mofuBofuImageInstruction = `
    **PRODUCT IMAGE (Step 1.5 - For MOFU & BOFU Pages):**
    No specific product image was provided. For the MOFU and BOFU pages, you must select a high-quality stock image that best represents the product itself. If the provided text contains image URLs, use them. Otherwise, use a service like \`https://source.unsplash.com/800x600/?<product-keywords>\` to find a suitable product-focused image.
    `;
  }


  return `
    **ROLE & OBJECTIVE:** You are an expert marketer, web developer, and Google Ads specialist. Your task is to generate three distinct landing pages (TOFU, MOFU, BOFU) AND a complete, strategic set of Google Ads assets for each funnel stage, all in ${params.language}. The final output must be a single, valid JSON object.

    **CONTEXT & ANALYSIS (Step 1):**
    First, deeply analyze the following "Product Information" provided by the user. From this text, you MUST extract:
    1.  **Product Name:** The official name of the product.
    2.  **Target Audience:** Who is this product for?
    3.  **Core Problem:** What specific problem does this product solve?
    4.  **Key Keywords (5-7):** The most important phrases describing the product's benefits and features.

    **PRODUCT INFORMATION (Source of Truth):**
    ---
    ${params.productInfo}
    ---

    ${mofuBofuImageInstruction}

    **PAGE GENERATION INSTRUCTIONS (Step 2):**
    Now, using ONLY the insights from your analysis, create the HTML for the three pages. The value for each page key ("tofu", "mofu", "bofu") must be a single string of complete, responsive, mobile-first HTML with inline Tailwind CSS classes.

    **Affiliate Link (for MOFU & BOFU CTAs):** ${finalAffiliateLink}
    **TOFU Page CTA Link:** ${tofuCtaLink}
    **CTA Behavior:** ALL Call-to-Action links (\`<a>\` tags) MUST open in a new browser tab (\`target="_blank"\` and \`rel="noopener noreferrer"\`).

    **PAGE REQUIREMENTS:**
    - **General:**
      - All pages must be a single HTML file using Tailwind CSS classes directly. No <style> tags.
      - Design must be modern, clean, and **fully responsive (mobile-first)**.
      - **Footer Requirement:** Every page MUST have a footer containing links for "Terms Of Use", "Disclaimer", "Privacy Policy" and the two full disclaimer texts provided in previous instructions.
    - **1. TOFU (Problem Awareness):**
      - **Goal:** Educate about the problem.
      - **Image (AI Generated):** MUST include a 1024x1024 AI-generated image representing the **Core Problem** using the format: \`<img src="https://image.pollinations.ai/prompt/{URL_ENCODED_PROMPT}?width=1024&height=1024" alt="...">\`.
      - **Content:** An engaging blog post about the core problem.
      - **CTA:** Soft CTA using the **TOFU Page CTA Link**.
    - **2. MOFU (Solution Comparison):**
      - **Goal:** Position the product as the best solution.
      - **Image:** Use the specific product image from Step 1.5.
      - **Content:** A professional review page (What is it?, How it Works, Benefits, Testimonials).
      - **CTA:** Clear button using the **main Affiliate Link**.
    - **3. BOFU (Direct Conversion):**
      - **Goal:** Drive an immediate sale.
      - **Image:** Use the specific product image from Step 1.5.
      - **Content:** High-urgency sales page (scarcity, social proof).
      - **CTA:** Compelling button using the **main Affiliate Link**.

    **AD CREATIVE GENERATION (Step 3):**
    Now, for EACH funnel stage (TOFU, MOFU, BOFU), generate a complete set of Google Ads assets that are **highly congruent with the landing page content for that stage**.

    **REQUIREMENTS FOR EACH FUNNEL STAGE:**
    1.  **Keywords:**
        - Generate 5-10 keywords for EACH match type (broad, phrase, exact).
        - **TOFU:** Problem-focused (e.g., "how to solve [problem]").
        - **MOFU:** Solution/category-focused (e.g., "[product category] reviews").
        - **BOFU:** Brand/purchase-intent focused (e.g., "buy [product name]").
    2.  **Ad Assets:**
        - **Headlines:** Generate EXACTLY 15 unique headlines. Each headline MUST be **30 characters or less**.
        - **Descriptions:** Generate EXACTLY 4 unique descriptions. Each description MUST be **90 characters or less**.
        - **Callouts:** Generate EXACTLY 4 unique, concise callouts (frases de destaque).
        - **Sitelinks:** Generate EXACTLY 4 unique sitelinks. For EACH sitelink, provide a title, description1, and description2.

    **JSON OUTPUT FORMAT:**
    Provide your response as a single, valid JSON object following this exact schema. Do not add any text or markdown before or after the JSON object.
  `;
};

const keywordMatchTypeSchema = {
    type: Type.OBJECT,
    properties: {
        broad: { type: Type.ARRAY, items: { type: Type.STRING } },
        phrase: { type: Type.ARRAY, items: { type: Type.STRING } },
        exact: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["broad", "phrase", "exact"]
};

const sitelinkSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description1: { type: Type.STRING },
        description2: { type: Type.STRING }
    },
    required: ["title", "description1", "description2"]
};

const adAssetsSchema = {
    type: Type.OBJECT,
    properties: {
        headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
        descriptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        callouts: { type: Type.ARRAY, items: { type: Type.STRING } },
        sitelinks: { type: Type.ARRAY, items: sitelinkSchema }
    },
    required: ["headlines", "descriptions", "callouts", "sitelinks"]
};

const funnelStageCreativeSchema = {
    type: Type.OBJECT,
    properties: {
        keywords: keywordMatchTypeSchema,
        adAssets: adAssetsSchema,
    },
    required: ["keywords", "adAssets"]
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        pages: {
            type: Type.OBJECT,
            properties: {
                tofu: { type: Type.STRING, description: "Complete HTML for TOFU page." },
                mofu: { type: Type.STRING, description: "Complete HTML for MOFU page." },
                bofu: { type: Type.STRING, description: "Complete HTML for BOFU page." }
            },
            required: ["tofu", "mofu", "bofu"],
        },
        adCreative: {
            type: Type.OBJECT,
            properties: {
                googleAds: {
                    type: Type.OBJECT,
                    properties: {
                        tofu: funnelStageCreativeSchema,
                        mofu: funnelStageCreativeSchema,
                        bofu: funnelStageCreativeSchema
                    },
                    required: ["tofu", "mofu", "bofu"]
                }
            },
            required: ["googleAds"]
        }
    },
    required: ["pages", "adCreative"],
};

export const generateLandingPages = async (params: GenerationParams): Promise<GenerationResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = createGeminiPrompt(params);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("API returned an empty response.");
    }

    const parsed = JSON.parse(jsonText);

    if (!parsed.pages || !parsed.adCreative) {
        throw new Error("API response is missing required pages or adCreative content.");
    }

    const pages: GeneratedPages = {
      [PageType.TOFU]: { type: PageType.TOFU, htmlContent: parsed.pages.tofu },
      [PageType.MOFU]: { type: PageType.MOFU, htmlContent: parsed.pages.mofu },
      [PageType.BOFU]: { type: PageType.BOFU, htmlContent: parsed.pages.bofu },
    };

    return { pages, adCreative: parsed.adCreative };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate pages: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating pages.");
  }
};
