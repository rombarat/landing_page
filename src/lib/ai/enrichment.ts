import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'

/**
 * Optional AI product enrichment. Disabled unless AI_ENRICHMENT_PROVIDER is set
 * together with credentials. It only ever *suggests* text; the merchant reviews
 * and saves. It never generates or replaces product photos.
 */
export type ProductSuggestion = { name: string; description: string; alt: string; category: string }

export interface EnrichmentProvider {
  readonly id: string
  suggest(input: { image: Buffer; mediaType: 'image/webp'; businessCategory: string; existingCategories: string[] }): Promise<ProductSuggestion>
}

const SuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  alt: z.string(),
  category: z.string(),
})

const SYSTEM_PROMPT = `אתה עוזר לבעלי עסקים קטנים בישראל לתאר מוצרים בחנות אונליין. מקבלים תמונה אחת של מוצר.
כתוב בעברית טבעית וחמה, בלי סופרלטיבים ריקים.
- name: שם קצר וברור למוצר (2–5 מילים).
- description: משפט או שניים שמתארים רק את מה שנראה בתמונה.
- alt: תיאור קצר של התמונה לקוראי מסך.
- category: אחת מהקטגוריות הקיימות אם מתאימה, אחרת הצעה קצרה (מילה או שתיים).
אסור להמציא פרטים שלא רואים בתמונה: רכיבים, חומרים, טעמים, מידות, משקל, אלרגנים, כשרות, תעודות או מקור. אם משהו לא ברור — פשוט לא לכתוב עליו.`

class ClaudeEnrichment implements EnrichmentProvider {
  readonly id = 'anthropic'
  private client = new Anthropic()
  private model = process.env.AI_ENRICHMENT_MODEL || 'claude-opus-5-5'

  async suggest(input: Parameters<EnrichmentProvider['suggest']>[0]): Promise<ProductSuggestion> {
    const response = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(SuggestionSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: input.mediaType, data: input.image.toString('base64') } },
            {
              type: 'text',
              text: `סוג העסק: ${input.businessCategory}. קטגוריות קיימות בחנות: ${input.existingCategories.join(', ') || 'אין עדיין'}.`,
            },
          ],
        },
      ],
    })
    if (response.stop_reason === 'refusal' || !response.parsed_output) throw new Error('no_suggestion')
    const out = response.parsed_output
    return {
      name: out.name.trim().slice(0, 100),
      description: out.description.trim().slice(0, 600),
      alt: out.alt.trim().slice(0, 200),
      category: out.category.trim().slice(0, 40),
    }
  }
}

export function getEnrichmentProvider(): EnrichmentProvider | null {
  if (process.env.AI_ENRICHMENT_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) return new ClaudeEnrichment()
  return null
}

export function isEnrichmentEnabled(): boolean {
  return getEnrichmentProvider() !== null
}
