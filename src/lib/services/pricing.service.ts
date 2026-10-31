import { Prisma } from "@/generated/prisma/client";

const GRAMS_PER_TOLA = new Prisma.Decimal("11.6638038");

type PriceInput = {
  grossWeightGrams: string;
  makingCharge: string;
  pricingMode: "DYNAMIC" | "FIXED";
  fixedPrice: string | null;
};

export function calculateProductPrice(
  product: PriceInput,
  pricePerTola?: string
): string {
  if (product.pricingMode === "FIXED") {
    if (product.fixedPrice === null) {
      throw new Error("Fixed price is required");
    }

    const fixedPrice = new Prisma.Decimal(product.fixedPrice);

    if (fixedPrice.lt(0)) {
      throw new Error("Fixed price cannot be negative");
    }

    return fixedPrice.toDecimalPlaces(2).toFixed(2);
  }

  if (!pricePerTola) {
    throw new Error("Metal rate is required");
  }

  const rate = new Prisma.Decimal(pricePerTola);
  const weight = new Prisma.Decimal(product.grossWeightGrams);
  const making = new Prisma.Decimal(product.makingCharge);

  if (
    rate.lte(0) ||
    weight.lte(0) ||
    making.lt(0)
  ) {
    throw new Error("Invalid pricing inputs");
  }

  const metalValue = rate.mul(weight).div(GRAMS_PER_TOLA);

  return metalValue
    .plus(making)
    .toDecimalPlaces(2)
    .toFixed(2);
}