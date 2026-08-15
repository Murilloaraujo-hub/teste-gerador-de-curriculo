import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversions } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.select().from(conversions).orderBy(desc(conversions.createdAt)).limit(15);
    return NextResponse.json({ conversions: list });
  } catch (e) {
    return NextResponse.json({ conversions: [] });
  }
}
