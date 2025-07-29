"use server";
import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { CATEGORIES } from "@/lib/utils";
import type { LineItem, Surcharge } from "@/lib/types";

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
        unitPrice: z.number().min(0.01).max(10000),
        assignedTo: z.array(z.string()).optional(),
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

const MAX_RECEIPTS = 3;
const prompt = `
You are an expert in extracting receipt data.
The image may show zero, one, or more receipts, in any language.
If more than one receipt is present, process up to ${MAX_RECEIPTS} receipts that are most complete and legible.
If a receipt is too unclear or slow to process, skip it and continue. Do not guess or hallucinate missing information.
Return only a valid JSON array of receipt objects with no markdown or explanation. If no valid receipts are found, return [].

## Output Format

Each receipt object should include:
{
  "merchant": "string (max 50 chars)",
  "date": "YYYY-MM-DD",
  "category": "string (max 50 chars)",
  "lineItems": [
    // Each line item as a stringified JSON object, e.g.:
    "{\"name\":\"string (max 100 chars)\",\"quantity\":number (1-1000),\"unitPrice\":number (0.01-10000),\"assignedTo\":[]}"
  ],
  "surcharges": [
    // Each surcharge as a stringified JSON object, e.g.:
    "{\"description\":\"string (max 100 chars)\",\"type\":\"fixed\"|\"percentage\",\"value\":number (-10000 to 10000)}"
  ],
  "taxType": "fixed" | "percentage",
  "taxValue": number (0-10000),
  "tipType": "fixed" | "percentage",
  "tipValue": number (0-10000)
}

Omit any optional fields that are not present in the receipt.

## Extraction Instructions

- Discard any receipt that is blurry, illegible, or missing merchant, category, or lineItems.
- For each receipt:
  - merchant: Extract the name with proper casing.
  - date: Format as YYYY-MM-DD. If missing, use today's date: ${new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })}.
  - category: Choose from: ${CATEGORIES.join(", ")}. Use "Miscellaneous" only if no category applies.
  - lineItems: Extract each purchased item as a separate stringified JSON object. Do not combine unrelated items.
		- Extract the item name without product codes, numbers, SKUs, or barcodes.
    - Use product codes (if present), name, and unit price to identify duplicates. Merge duplicate items by summing their quantities.
  - surcharges: Only include extra charges or discounts (e.g., delivery fees, service fees). Omit if none.
    - "value" negative for discounts; use percentage if type is "percentage", and currency amount if "fixed".
    - Any "tip", "gratuity", or similar is a tip, not a surcharge.
  - taxType, taxValue, tipType, tipValue: If present, use "percentage" for percentage values (e.g. 7.5 for 7.5%). If "fixed", use the currency amount.
- After extracting all fields, if a total is shown, make sure the sum of lineItems, surcharges, tax, and tip matches the total (within 1 unit). Correct any discrepancies.

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
    if (!output || !Array.isArray(output) || output.length === 0)
      throw new Error("No receipt data extracted");
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
        (item) => JSON.parse(item) as LineItem,
      );
    }

    if (
      Array.isArray(receipt.surcharges) &&
      typeof receipt.surcharges[0] === "string"
    ) {
      receipt.surcharges = (receipt.surcharges as unknown as string[]).map(
        (item) => JSON.parse(item) as Surcharge,
      );
    }

    return ReceiptSchema.parse(receipt);
  });
}
