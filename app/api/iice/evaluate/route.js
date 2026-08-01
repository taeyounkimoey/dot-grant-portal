import { NextResponse } from "next/server";
import path from "node:path";

export const runtime = "nodejs";

// 1. POLYFILL BROWSER GLOBALS FOR VERCEL
// Must run before PDFParse / pdfjs-dist initializes
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m21 = 0; m22 = 1; m41 = 0; m42 = 0;
    constructor() {}
  };
}

// 2. IMPORT AFTER POLYFILL
import { PDFParse } from "pdf-parse";

const NOFO_REPOSITORY = {
  "SS4A-FY26": {
    title: "Safe Streets and Roads for All (SS4A FY26)",
    eligibleEntities: ["City", "County", "MPO", "Transit Authority", "Tribal Government"],
    minLocalMatchPct: 0.2,
    deadline: "2026-06-26T17:00:00Z",
  },
  "RAISE-FY26": {
    title: "Rebuilding American Infrastructure with Sustainability & Equity (RAISE FY26)",
    eligibleEntities: ["State", "City", "County", "MPO", "Transit Authority", "Port Authority", "Tribal Government"],
    minLocalMatchPct: 0.2,
    deadline: "2026-02-24T17:00:00Z",
  },
};

function parseFundingLetter(letterText, requiredMatchDollars) {
  const flags = [];
  let extractedAmount = 0;

  const dollarMatches = letterText.match(/\$\s*([\d,]+(?:\.\d{2})?)/g);
  if (dollarMatches) {
    const amounts = dollarMatches.map((val) => parseFloat(val.replace(/[\$,]/g, "")));
    extractedAmount = Math.max(...amounts);
  } else {
    flags.push("NLP Alert: No monetary figures extracted from attached funding letter.");
  }

  const contingentTerms = ["pending", "contingent", "hope to", "if approved", "tentative"];
  const lowerText = letterText.toLowerCase();
  if (contingentTerms.some((term) => lowerText.includes(term))) {
    flags.push("NLP Alert: Attached letter contains uncommitted or contingent language (e.g., 'pending' or 'hope to').");
  }

  if (extractedAmount < requiredMatchDollars) {
    const shortfall = requiredMatchDollars - extractedAmount;
    flags.push(
      "Math Discrepancy: Letter amount ($" + extractedAmount.toLocaleString() + ") does not cover required local match ($" + requiredMatchDollars.toLocaleString() + "). Shortfall: $" + shortfall.toLocaleString() + "."
    );
  }

  return { extractedAmount, flags };
}

export async function POST(request) {
  const startTime = performance.now();
  const auditTrail = [];

  try {
    const form = await request.formData();

    const nofoKey = String(form.get("nofoKey") || "");
    const appName = String(form.get("appName") || "");
    const entityType = String(form.get("entityType") || "");

    const samGovRaw = form.get("samGovActive");
    const samGovActive = samGovRaw === true || String(samGovRaw).toLowerCase() === "true";

    const totalCost = parseFloat(String(form.get("totalCost") || ""));
    const declaredMatch = parseFloat(String(form.get("declaredMatch") || ""));

    const nofo = NOFO_REPOSITORY[nofoKey];
    if (!nofo) {
      return NextResponse.json({ error: "Invalid NOFO selection key." }, { status: 400 });
    }

    if (!Number.isFinite(totalCost) || totalCost <= 0 || !Number.isFinite(declaredMatch) || declaredMatch < 0) {
      return NextResponse.json(
        { error: "Invalid numeric input for totalCost or declaredMatch." },
        { status: 400 }
      );
    }

    if (!samGovActive) {
      auditTrail.push("CRITICAL FAIL: SAM.gov registration is inactive or expired.");
    }

    if (!nofo.eligibleEntities.includes(entityType)) {
      auditTrail.push(`CRITICAL FAIL: Entity type '${entityType}' is legally INELIGIBLE under ${nofoKey} rules.`);
    }

    const calculatedMatchPct = declaredMatch / totalCost;
    const requiredMatchDollars = totalCost * nofo.minLocalMatchPct;
    if (calculatedMatchPct < nofo.minLocalMatchPct) {
      auditTrail.push(
        "CRITICAL FAIL: Provided match (" + (calculatedMatchPct * 100).toFixed(1) + "%) is below mandatory " + nofo.minLocalMatchPct * 100 + "% NOFO floor."
      );
    }

    let letterText = String(form.get("letterText") || "");
    const uploaded = form.get("funding_letter_pdf");

    if (uploaded && typeof uploaded === "object" && "arrayBuffer" in uploaded) {
      const bytes = new Uint8Array(await uploaded.arrayBuffer());
      const parser = new PDFParse({ data: bytes });
      const parsed = await parser.getText();
      await parser.destroy();
      letterText = parsed.text || letterText;
    }

    const nlpAudit = parseFundingLetter(letterText, requiredMatchDollars);
    if (nlpAudit.flags.length > 0) {
      auditTrail.push(...nlpAudit.flags);
    }

    const executionTimeMs = (performance.now() - startTime).toFixed(2);
    const decision = auditTrail.length === 0 ? "PASS" : "FLAGGED FOR REJECTION";

    return NextResponse.json({
      applicantName: appName,
      evaluatedAgainst: nofo.title,
      decision,
      executionTime: executionTimeMs + " ms",
      auditTrail: auditTrail.length === 0
        ? ["All structured criteria & NLP commitments verified."]
        : auditTrail,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to evaluate application.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}