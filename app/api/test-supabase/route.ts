import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from("residents").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Failed to connect to Supabase database",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase!",
      timestamp: new Date().toISOString(),
      data: data,
    })
  } catch (error) {
    console.error("Connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to test Supabase connection",
      },
      { status: 500 },
    )
  }
}
