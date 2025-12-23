import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getBillTemplates,
  getBillInstances,
  createBillInstance,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";
import { where } from "firebase/firestore";
import { expandBillTemplate } from "@/lib/cash-runway/expanders";

/**
 * POST /api/bills/generate-instances
 * Generates bill instances from active templates for a date range
 * 
 * Request body:
 * {
 *   startDate: string (YYYY-MM-DD)
 *   endDate: string (YYYY-MM-DD)
 *   templateIds?: string[] (optional, generate for specific templates only)
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
    const { startDate, endDate, templateIds } = body;

    // Validation
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date" },
        { status: 400 }
      );
    }

    // Fetch active templates
    const constraints = [where("isActive", "==", true)];
    if (templateIds && templateIds.length > 0) {
      // Note: Firestore doesn't support 'in' with more than 10 items
      // For large arrays, you'd need to batch queries
      if (templateIds.length > 10) {
        return NextResponse.json(
          { error: "Cannot generate for more than 10 templates at once" },
          { status: 400 }
        );
      }
      // We'll filter client-side for simplicity
    }

    const templates = await getBillTemplates(constraints);
    const filteredTemplates = templateIds
      ? templates.filter((t) => templateIds.includes(t.id))
      : templates;

    if (filteredTemplates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No templates found to generate instances",
        generatedCount: 0,
      });
    }

    // Check existing instances to avoid duplicates
    const existingInstances = await getBillInstances([
      where("dueDate", ">=", start),
      where("dueDate", "<=", end),
    ]);

    const existingKeys = new Set(
      existingInstances
        .filter((i) => i.templateId)
        .map((i) => `${i.templateId}_${i.dueDate.toDate().toISOString().split("T")[0]}`)
    );

    let generatedCount = 0;

    // Generate instances for each template
    for (const template of filteredTemplates) {
      const billInstances = expandBillTemplate(template, start, end);

      for (const instance of billInstances) {
        const dueDateStr = instance.dueDate.toDate().toISOString().split("T")[0];
        const key = `${template.id}_${dueDateStr}`;

        // Skip if already exists
        if (existingKeys.has(key)) {
          continue;
        }

        await createBillInstance({
          ...instance,
          templateId: template.id,
        });

        generatedCount++;
      }
    }

    // Invalidate forecast cache if any instances were generated
    if (generatedCount > 0) {
      await invalidateForecastCache();
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedCount} bill instances`,
      generatedCount,
      templatesProcessed: filteredTemplates.length,
    });
  } catch (error: any) {
    console.error("Error generating bill instances:", error);
    return NextResponse.json(
      {
        error: "Failed to generate bill instances",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
