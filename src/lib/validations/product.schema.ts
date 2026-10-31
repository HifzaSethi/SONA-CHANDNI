
import { z } from "zod";

const money = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid monetary amount");

const weight = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, "Enter a valid weight")
  .refine((value) => Number(value) > 0, "Weight must be positive");

export const createProductSchema = z
  .object({
    sku: z.string().trim().min(2).max(50),
    name: z.string().trim().min(3).max(200),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

    description: z.string().max(5000).optional(),

    metal: z.enum(["GOLD", "SILVER"]),
    karat: z.number().int().min(1).max(24).nullable(),

    grossWeightGrams: weight,
    netMetalWeightGrams: weight,

    makingCharge: money,
    stoneCharge: money,

    pricingMode: z.enum(["DYNAMIC", "FIXED"]),
    fixedPrice: money.nullable(),

    stockQuantity: z.number().int().min(0),
    published: z.boolean(),

    categoryId: z.uuid(),
  })
  .superRefine((product, ctx) => {
    if (
      Number(product.netMetalWeightGrams) >
      Number(product.grossWeightGrams)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["netMetalWeightGrams"],
        message: "Net metal weight cannot exceed gross weight",
      });
    }

    if (product.metal === "GOLD" &&
        ![18, 21, 22, 24].includes(product.karat ?? 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["karat"],
        message: "Gold purity must be 18K, 21K, 22K, or 24K",
      });
    }

    if (product.metal === "SILVER" && product.karat !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["karat"],
        message: "Silver products should use null for karat",
      });
    }

    if (product.pricingMode === "FIXED" &&
        (product.fixedPrice === null ||
         Number(product.fixedPrice) <= 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["fixedPrice"],
        message: "Fixed-price products require a positive price",
      });
    }

    if (product.pricingMode === "DYNAMIC" &&
        product.fixedPrice !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["fixedPrice"],
        message: "Dynamic products must not have a fixed price",
      });
    }
  });

export type CreateProductInput = z.infer<
  typeof createProductSchema
>;
