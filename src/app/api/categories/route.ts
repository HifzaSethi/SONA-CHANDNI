
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch categories",
      },
      { status: 500 }
    );
  }
}
