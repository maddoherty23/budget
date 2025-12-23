import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  createBillTemplate,
  getBillTemplates,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";
import { where } from "firebase/firestore";

/**
 * GET /api/bills/templates
 * Returns all bill templates for the authenticated user
 * 
 * Query params:
 * - categoryId?: string (filter by category)
 * - isActive?: boolean (filter by active status, default true)
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const isActive = searchParams.get("isActive") !== "false"; // Default true

    const constraints = [];
    
    if (categoryId) {
      constraints.push(where("categoryId", "==", categoryId));
    }
    
    if (isActive !== null) {
      constraints.push(where("isActive", "==", isActive));
    }

    const templates = await getBillTemplates(constraints);

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error("Error fetching bill templates:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bill templates",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bills/templates
 * Creates a new bill template
 * 
 * Request body:
 * {
 *   name: string
 *   defaultAmount: number
 *   categoryId?: string
 *   priority: "critical" | "flexible" | "delayable"
 *   consequenceWeight: number (0-100)
 *   dueRule: { type: "dayOfMonth", day: number } | { type: "rrule", rrule: string }
 *   dueWindow: { early: number, late: number }
 *   autopay: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      defaultAmount,
      categoryId,
      priority,
      consequenceWeight,
      dueRule,
      dueWindow,
      autopay,
    } = body;

    // Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!defaultAmount || typeof defaultAmount !== "number" || defaultAmount <= 0) {
      return NextResponse.json(
        { error: "Valid default amount is required" },
        { status: 400 }
      );
    }

    if (!["critical", "flexible", "delayable"].includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority value" },
        { status: 400 }
      );
    }

    if (
      typeof consequenceWeight !== "number" ||
      consequenceWeight < 0 ||
      consequenceWeight > 100
    ) {
      return NextResponse.json(
        { error: "Consequence weight must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (!dueRule || !dueRule.type) {
      return NextResponse.json(
        { error: "Due rule is required" },
        { status: 400 }
      );
    }

    // Create template
    const templateId = await createBillTemplate({
      name,
      defaultAmount,
      categoryId: categoryId || null,
      priority,
      consequenceWeight,
      dueRule,
      dueWindow: dueWindow || { early: 0, late: 0 },
      autopay: autopay || false,
      isActive: true,
    });

    // Invalidate forecast cache
    await invalidateForecastCache();

    return NextResponse.json(
      {
        success: true,
        templateId,
        message: "Bill template created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating bill template:", error);
    return NextResponse.json(
      {
        error: "Failed to create bill template",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
