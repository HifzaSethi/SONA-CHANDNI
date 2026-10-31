
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-guard";

const updateSchema = z.object({
  metal: z.enum(["GOLD", "SILVER"]),
  pricePerTola: z
    .string()
    .regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a valid rate with up to 2 decimal places"),
});

export async function GET(request: Request) {
  const access = await requireRoles(request, ["admin", "staff"]);

  if (!access.authorized) {
    return NextResponse.json(
      { success: false, message: "Access denied" },
      { status: access.status }
    );
  }

  try {
    const rates = await prisma.metalRate.findMany({
      orderBy: { metal: "asc" },
    });

    return NextResponse.json({ success: true, data: rates });
  } catch (error) {
    console.error("Metal rates fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch metal rates" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const access = await requireRoles(request, ["admin", "staff"]);

  if (!access.authorized) {
    return NextResponse.json(
      { success: false, message: "Access denied" },
      { status: access.status }
    );
  }

  try {
    const parsed = updateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid rate information",
          errors: z.flattenError(parsed.error),
        },
        { status: 400 }
      );
    }

    const { metal, pricePerTola } = parsed.data;
    const karat = metal === "GOLD" ? 24 : 0;
    const newRate = new Prisma.Decimal(pricePerTola);

    if (newRate.lte(0)) {
      return NextResponse.json(
        { success: false, message: "Rate must be greater than zero" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.metalRate.findUnique({
        where: {
          metal_karat: { metal, karat },
        },
      });

      if (existing?.pricePerTola.equals(newRate)) {
        return { unchanged: true, rate: existing };
      }

      const rate = await tx.metalRate.upsert({
        where: {
          metal_karat: { metal, karat },
        },
        create: {
          metal,
          karat,
          pricePerTola: newRate,
        },
        update: {
          pricePerTola: newRate,
        },
      });

      await tx.metalRateHistory.create({
        data: {
          metal,
          karat,
          oldPricePerTola: existing?.pricePerTola ?? null,
          newPricePerTola: newRate,
          changedBy: access.session.user.id,
        },
      });

      return { unchanged: false, rate };
    });

    return NextResponse.json({
      success: true,
      message: result.unchanged
        ? "Rate is already up to date"
        : "Metal rate updated successfully",
      data: result.rate,
    });
  } catch (error) {
    console.error("Metal rate update error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update metal rate" },
      { status: 500 }
    );
  }
}
