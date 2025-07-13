"use server";
import { ExpenseCategories } from "@/models/Receipt";
import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ExtractReceiptDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo (data URI, must include MIME type and Base64 encoding). May contain a single receipt, multiple receipts, or no receipts at all. If no receipts are found, return an empty array. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
});
export type ExtractReceiptDataInput = z.infer<
  typeof ExtractReceiptDataInputSchema
>;

const ReceiptSchema = z.object({
  vendor: z
    .string()
    .describe("The name of the vendor or merchant on the receipt."),
  date: z.date().describe("The date of the receipt as a Date object."),
  category: z
    .string()
    .describe(
      "The most appropriate category for the receipt, e.g., 'Groceries', 'Subscription', 'Pet Supplies', or 'Miscellaneous'.",
    ),
  lineItems: z
    .array(
      z.object({
        name: z.string().describe("Name of the purchased item."),
        quantity: z.number().describe("Quantity of the item purchased."),
        price: z
          .number()
          .describe(
            "Price per single unit of the item, rounded to two decimal places.",
          ),
        assignedTo: z
          .array(z.string())
          .optional()
          .default([])
          .describe(
            "Names of users assigned to this item, if any. Defaults to empty array.",
          ),
      }),
    )
    .describe("All individual line items on the receipt."),
  extras: z
    .array(
      z.object({
        description: z
          .string()
          .describe("Description of the extra charge or discount."),
        type: z
          .enum(["fixed", "percentage"])
          .describe("Type of extra charge: fixed amount or percentage."),
        amount: z
          .number()
          .describe(
            "Amount of the extra charge or discount. Discounts must be negative.",
          ),
      }),
    )
    .optional()
    .default([])
    .describe(
      "Other receipt-level charges or discounts, e.g., 'bag fee', 'service charge', 'coupon'. Defaults to empty array.",
    ),
  taxType: z
    .enum(["fixed", "percentage"])
    .optional()
    .describe("Type of tax: fixed amount or percentage."),
  taxAmount: z.number().optional().describe("Total tax amount on the receipt."),
  tipType: z
    .enum(["fixed", "percentage"])
    .optional()
    .describe("Type of tip: fixed amount or percentage."),
  tipAmount: z
    .number()
    .optional()
    .describe("Total tip or gratuity amount on the receipt."),
  splitMode: z
    .enum(["simple", "advanced"])
    .optional()
    .describe("Mode of splitting the receipt among users."),
  splitUsers: z
    .array(
      z.object({
        name: z.string().describe("Name of the user involved in the split."),
        isPaying: z
          .boolean()
          .optional()
          .describe("Whether the user is paying."),
        paid: z.boolean().optional().describe("Whether the user has paid."),
        assignedItems: z
          .array(z.string())
          .optional()
          .default([])
          .describe("Items assigned to this user. Defaults to empty array."),
        subtotal: z.number().optional().describe("Subtotal for this user."),
        extras: z.number().optional().describe("Extra charges for this user."),
        tax: z.number().optional().describe("Tax amount for this user."),
        tip: z.number().optional().describe("Tip amount for this user."),
      }),
    )
    .optional()
    .default([])
    .describe(
      "Details of users involved in splitting the receipt. Defaults to empty array.",
    ),
});

const ReceiptsSchema = z.array(ReceiptSchema);
export type ExtractReceiptDataOutput = z.infer<typeof ReceiptsSchema>;

const MAX_RECEIPTS = 5;
const promptText = `
You are an AI assistant tasked with extracting structured data from receipt images. The image may contain zero, one, or multiple receipts, in any language.

If no receipts are detected, return an empty array.
If multiple receipts are found, extract data for each receipt (up to ${MAX_RECEIPTS}) and return them as an array.
If there are duplicate images or receipts in one processing, discard duplicates from the output.

Before returning, discard any receipts where:
- Line items are missing, empty, or invalid (including unreasonable negative numbers).
- Any required field (vendor, date, category, line items) is missing or clearly invalid.

For each receipt found, extract the following details:

- **Vendor name:** The merchant or vendor's name as shown on the receipt.
  - Ensure the vendor name uses proper casing and matches standard capitalization for business or brand names.

- **Date:** The receipt date as a Date object (parsed from the receipt).
  - If no date is found, use today's date: ${new Date().toISOString().split("T")[0]}.
  - If the year is missing, assume the current year.

- **Category:** Assign the most appropriate expense category for the receipt.
  - You may use one of these primary categories if it fits: ${ExpenseCategories.join(", ")}.
  - If none fit closely, create a clear, generic category name different from these (e.g., 'Groceries', 'Subscription', 'Pet Supplies').
  - Do NOT use 'Other' as a category. Use 'Miscellaneous' only when no other category fits and no better one can be made.

- **Line items:** Extract all individual purchased items with:
  - Name of the item. Do not include item numbers or codes.
  - Quantity purchased (sum quantities of items with identical name and unit price).
  - Price per single unit (rounded to two decimal places).

- **Extras:** Extract all receipt-level extra charges or discounts (such as 'bag fee', 'service charge', 'coupon').
  - Each extra should include description, type ('fixed' or 'percentage'), and amount.
  - Discounts must have a negative amount.
  - This should be an array; if none, return an empty array.

- **Tax and tip:**
  - Extract total tax amount and its type ('fixed' or 'percentage').
  - Extract total tip or gratuity amount and its type ('fixed' or 'percentage').
  - If not present, omit these fields.

Output all extracted data in the specified JSON format strictly matching the schema.

Receipt Image: {{media url=photoDataUri}}
`;

const prompt = ai.definePrompt({
  name: "extractReceiptDataPrompt",
  input: { schema: ExtractReceiptDataInputSchema },
  output: { schema: ReceiptsSchema },
  prompt: promptText,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: "extractReceiptDataFlow",
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ReceiptsSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error("No receipt data extracted");
    }
    return output;
  },
);

export async function extractReceiptData(input: ExtractReceiptDataInput) {
  const receipts = await extractReceiptDataFlow(input);
  return receipts.map((receipt) => ({
    ...receipt,
    date: new Date(receipt.date),
  }));
}
