import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateProductPrice } from "./pricing.service";

type JewelleryProduct = {
  metal: "GOLD" | "SILVER";
  karat: number | null;
  pricingMode: "DYNAMIC" | "FIXED";
  grossWeightGrams: Prisma.Decimal;
  makingCharge: Prisma.Decimal;
  fixedPrice: Prisma.Decimal | null;
};

export async function getProductPrice(product: JewelleryProduct) {
  const input = {
    grossWeightGrams: product.grossWeightGrams.toString(),
    makingCharge: product.makingCharge.toString(),
    pricingMode: product.pricingMode,
    fixedPrice: product.fixedPrice?.toString() ?? null,
  };

  // Fixed-price products do not require a market rate.
  if (product.pricingMode === "FIXED") {
    return {
      price: calculateProductPrice(input),
      priceStatus: "FIXED" as const,
    };
  }

  // Gold uses one reference rate: 24K per tola.
  // Silver uses one independent rate per tola, stored with karat = 0.
  const rateKey =
    product.metal === "GOLD"
      ? { metal: "GOLD" as const, karat: 24 }
      : { metal: "SILVER" as const, karat: 0 };

  if (
    product.metal === "GOLD" &&
    (product.karat === null || product.karat < 1 || product.karat > 24)
  ) {
    return {
      price: null,
      priceStatus: "UNAVAILABLE" as const,
    };
  }

  const rate = await prisma.metalRate.findUnique({
    where: {
      metal_karat: rateKey,
    },
  });

  if (!rate) {
    return {
      price: null,
      priceStatus: "RATE_MISSING" as const,
    };
  }

  // Convert the 24K gold rate to the product's karat.
  // Silver uses its stored per-tola rate directly.
  const applicableRate =
    product.metal === "GOLD"
      ? new Prisma.Decimal(rate.pricePerTola.toString())
          .mul(product.karat!)
          .div(24)
      : new Prisma.Decimal(rate.pricePerTola.toString());

  return {
    price: calculateProductPrice(
      {
        ...input,
        pricingMode: "DYNAMIC",
        fixedPrice: null,
      },
      applicableRate.toString()
    ),
    priceStatus: "ESTIMATED" as const,
    rateUpdatedAt: rate.updatedAt,
  };
}