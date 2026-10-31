
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getProductPrice } from "@/lib/services/product-pricing.service";
import { z } from "zod";

const querySchema = z.object({
  metal: z.enum(["GOLD", "SILVER"]).optional(),

  category: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    // 1. Validate query parameters
    const parsed = querySchema.safeParse({
      metal: params.get("metal") ?? undefined,
      category: params.get("category") ?? undefined,
      page: params.get("page") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: z.flattenError(parsed.error),
        },
        { status: 400 }
      );
    }

    const { metal, category, page, limit } = parsed.data;

    // 2. Build database filters
    const where: Prisma.ProductWhereInput = {
      published: true,

      ...(metal && { metal }),

      ...(category && {
        category: {
          slug: category,
        },
      }),
    };

    // 3. Retrieve products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,

        select: {
          id: true,
          sku: true,
          name: true,
          slug: true,
          description: true,
          metal: true,
          karat: true,
          grossWeightGrams: true,
          
          makingCharge: true,
         
          pricingMode: true,
          fixedPrice: true,
          stockQuantity: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },

        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],

        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.product.count({ where }),
    ]);

    // 4. Calculate prices from current database rates
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        const pricing = await getProductPrice(product);

        return {
          ...product,
          calculatedPrice: pricing.price,
          priceStatus: pricing.priceStatus,
        };
      })
    );

    // 5. Return priced products with pagination
    return NextResponse.json({
      success: true,
      data: productsWithPrices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // 6. Handle unexpected failures
    console.error("Products API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve products",
      },
      { status: 500 }
    );
  }
}
