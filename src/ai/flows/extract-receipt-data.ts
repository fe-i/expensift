"use server";
import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { Categories } from "@/lib/utils";

const ExtractReceiptDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo (data URI, must include MIME type and Base64 encoding). Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
});

export type ExtractReceiptDataInput = z.infer<
  typeof ExtractReceiptDataInputSchema
>;

const ReceiptSchema = z.object({
  merchant: z.string().min(1).max(50),
  date: z.string(),
  category: z.string().max(50),
  lineItems: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        quantity: z.number().int().min(1).max(1000),
        unitPrice: z.number().min(0).max(10000),
      }),
    )
    .min(1)
    .max(500),
  surcharges: z
    .array(
      z.object({
        description: z.string().min(1).max(100),
        type: z.enum(["fixed", "percentage"]),
        value: z.number().min(-10000).max(10000),
      }),
    )
    .max(5)
    .optional(),
  taxType: z.enum(["fixed", "percentage"]).optional(),
  taxValue: z.number().min(0).max(10000).optional(),
  tipType: z.enum(["fixed", "percentage"]).optional(),
  tipValue: z.number().min(0).max(10000).optional(),
});

const ExtractReceiptDataOutputSchema = z.array(ReceiptSchema);
export type ExtractReceiptDataOutput = z.infer<
  typeof ExtractReceiptDataOutputSchema
>;

const MAX_RECEIPTS = 5;
const prompt = `
You are an expert in extracting receipt data. Analyze the provided image, which may contain zero, one, or multiple receipts in any language.

## Output Format

Respond ONLY with a valid JSON array of receipt objects. No explanations or markdown.
If no receipts are found, return an empty array: []
If multiple receipts are detected, return up to ${MAX_RECEIPTS} receipt objects.

Each receipt must have this structure:
{
  "merchant": "string (max 50 chars)",
  "date": "YYYY-MM-DD",
  "category": "string (max 50 chars)",
  "lineItems": [
    // IMPORTANT: Each line item must be a **stringified JSON object** (not an object).
    // Example: "{\"name\":\"Coffee\",\"quantity\":2,\"unitPrice\":3.50}"
    "stringified line item object",
    ...
  ],
  "surcharges": [
    {
      "description": "string (max 100 chars)",
      "type": "fixed" | "percentage",
      "value": number (-10000 to 10000)
    }
  ],
  "taxType": "fixed" | "percentage",
  "taxValue": number (0-10000),
  "tipType": "fixed" | "percentage",
  "tipValue": number (0-10000)
}

All fields marked as optional in the schema may be omitted if not present on the receipt.
Do not include fields that are not present on the receipt.

## Extraction Instructions

- **Discard** any receipt that is unclear, illegible, ambiguous, or missing required fields: merchant, date, category, or lineItems.
- For each receipt:
  - **merchant**: Extract the merchant's name as it appears (max 50 chars).
  - **date**: Use format YYYY-MM-DD. If no date is found, use today's date: ${new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })}.
  - **category**: Assign a category from: ${Categories.join(", ")}. Use "Miscellaneous" only if none apply.
  - **lineItems**: 
    - For each purchased item, output a **stringified JSON object** with "name", "quantity", and "unitPrice" fields.
    - If multiple items on the receipt are the same (same name and unit price), merge them into a single line item and sum their quantity.
  - **surcharges**: List extra charges/discounts if present. Omit if none.
    - "value" should be negative for discounts and must be the percentage value (e.g. 7.5 for 7.5%). If "fixed", use the currency amount.
  - **taxType**, **taxValue**, **tipType**, **tipValue**: Include only if present on the receipt.
    - If taxType or tipType is "percentage", taxValue or tipValue must be the percentage value (e.g. 7.5 for 7.5%). If "fixed", use the currency amount.

Input Image: {{media url=photoDataUri}}
`;

const extractReceiptDataPrompt = ai.definePrompt({
  name: "extractReceiptDataPrompt",
  input: { schema: ExtractReceiptDataInputSchema },
  output: { schema: ExtractReceiptDataOutputSchema },
  prompt,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: "extractReceiptDataFlow",
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async (input) => {
    const { output } = await extractReceiptDataPrompt(input);
    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error("No receipt data extracted");
    }
    return output;
  },
);

export async function extractReceiptData(input: ExtractReceiptDataInput) {
  const receipts = await extractReceiptDataFlow(input);
  return receipts.map((receipt) => {
    if (
      Array.isArray(receipt.lineItems) &&
      typeof receipt.lineItems[0] === "string"
    ) {
      receipt.lineItems = (receipt.lineItems as unknown as string[]).map(
        (item) => JSON.parse(item),
      );
    }
    return ReceiptSchema.parse(receipt);
  });
}
