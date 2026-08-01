"use client";

import { useState } from "react";

const NOFO_OPTIONS = [
  { key: "SS4A-FY26", label: "Safe Streets and Roads for All (SS4A FY26)" },
  { key: "RAISE-FY26", label: "Rebuilding American Infrastructure with Sustainability & Equity (RAISE FY26)" },
];

const APPLICANT_OPTIONS = [
  "Springfield City DOT",
  "Metro Valley Transit Authority",
  "Redwood County Public Works",
  "Great Plains MPO",
  "Blue River Tribal Government",
  "Harbor City Transportation Dept",
];

const ENTITY_OPTIONS = [
  "City",
  "County",
  "MPO",
  "Transit Authority",
  "Tribal Government",
  "State",
  "Port Authority",
];

export default function Home() {
  const [form, setForm] = useState({
    nofoKey: "SS4A-FY26",
    appName: "Springfield City DOT",
    entityType: "City",
    samGovActive: "true",
    totalCost: "",
    declaredMatch: "",
    letterText: "",
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function updateField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const body = new FormData();
      body.append("nofoKey", form.nofoKey);
      body.append("appName", form.appName);
      body.append("entityType", form.entityType);
      body.append("samGovActive", form.samGovActive);
      body.append("totalCost", form.totalCost);
      body.append("declaredMatch", form.declaredMatch);
      body.append("letterText", form.letterText);

      if (pdfFile) {
        body.append("funding_letter_pdf", pdfFile);
      }

      const res = await fetch("/api/iice/evaluate", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data && data.details ? data.details : (data && data.error ? data.error : "Request failed."));
      }

      setResult(data);
    } catch (err) {
      setError(err && err.message ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  const decisionClass =
    result && result.decision === "PASS" ? "bg-success" : "bg-danger";

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <div className="mb-4">
                <h1 className="h3 mb-2">DOT Grant Portal POC</h1>
                <p className="text-secondary mb-0">
                  Evaluate an application against NOFO rules and funding letter checks.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">NOFO</label>
                    <select
                      name="nofoKey"
                      value={form.nofoKey}
                      onChange={updateField}
                      className="form-select"
                    >
                      {NOFO_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.key} - {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Applicant Name</label>
                    <select
                      name="appName"
                      value={form.appName}
                      onChange={updateField}
                      className="form-select"
                      required
                    >
                      {APPLICANT_OPTIONS.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Entity Type</label>
                    <select
                      name="entityType"
                      value={form.entityType}
                      onChange={updateField}
                      className="form-select"
                    >
                      {ENTITY_OPTIONS.map((entity) => (
                        <option key={entity} value={entity}>
                          {entity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">SAM.gov Active</label>
                    <select
                      name="samGovActive"
                      value={form.samGovActive}
                      onChange={updateField}
                      className="form-select"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Total Project Cost</label>
                    <input
                      name="totalCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.totalCost}
                      onChange={updateField}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Declared Local Match</label>
                    <input
                      name="declaredMatch"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.declaredMatch}
                      onChange={updateField}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Letter Text (optional)</label>
                    <textarea
                      name="letterText"
                      rows={4}
                      value={form.letterText}
                      onChange={updateField}
                      className="form-control"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Funding Letter PDF (optional)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                      className="form-control"
                    />
                  </div>

                  <div className="col-12 mt-2">
                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                      {loading ? "Evaluating..." : "Evaluate Application"}
                    </button>
                  </div>
                </div>
              </form>

              {error ? (
                <div className="alert alert-danger mt-4 mb-0" role="alert">
                  {error}
                </div>
              ) : null}

              {result ? (
                <div className="card mt-4 border">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <h2 className="h5 mb-0">Evaluation Result</h2>
                      <span className={"badge " + decisionClass}>{result.decision}</span>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-12 col-md-6">
                        <div><strong>Applicant:</strong> {result.applicantName}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div><strong>NOFO:</strong> {result.evaluatedAgainst}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div><strong>Execution Time:</strong> {result.executionTime}</div>
                      </div>
                    </div>

                    <h3 className="h6">Audit Trail</h3>
                    <ul className="mb-0">
                      {(result.auditTrail || []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}