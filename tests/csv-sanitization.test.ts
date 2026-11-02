import { describe, it, expect } from "vitest";
import { sanitizeCsvField, generateCsv, parseCsv } from "../src/lib/csv";

describe("CSV Sanitization and Formula Injection Protection (CWE-1236)", () => {
  it("Prepends single quote to values starting with =, +, -, @, \\t, or \\r", () => {
    expect(sanitizeCsvField("=SUM(A1:A10)")).toBe("`'=SUM(A1:A10)`".replace(/`/g, ""));
    expect(sanitizeCsvField("+cmd|' /C calc'!A0")).toBe("`'+cmd|' /C calc'!A0`".replace(/`/g, ""));
    expect(sanitizeCsvField("-12345")).toBe("`'-12345`".replace(/`/g, ""));
    expect(sanitizeCsvField("@malicious_macro")).toBe("`'@malicious_macro`".replace(/`/g, ""));
    expect(sanitizeCsvField("\tTabIndented")).toBe("`'\tTabIndented`".replace(/`/g, ""));
  });

  it("Preserves regular alphanumeric and safe characters unmodified", () => {
    expect(sanitizeCsvField("Acme Corporation")).toBe("Acme Corporation");
    expect(sanitizeCsvField("john.doe@example.com")).toBe("john.doe@example.com");
    expect(sanitizeCsvField("123 Main Street")).toBe("123 Main Street");
  });

  it("Escapes double quotes and commas cleanly", () => {
    expect(sanitizeCsvField('Hello, "World"')).toBe('"Hello, ""World"""');
  });

  it("Generates compliant CSV string with sanitized fields", () => {
    const data = [
      { name: "Safe Org", website: "=DDE('cmd';'/c calc';'a')" },
      { name: "Normal Org", website: "https://normal.com" },
    ];

    const csv = generateCsv(
      [
        { key: "name", header: "Name" },
        { key: "website", header: "Website" },
      ],
      data
    );

    expect(csv).toContain("Safe Org,'=DDE('cmd';'/c calc';'a')");
    expect(csv).toContain("Normal Org,https://normal.com");
  });

  it("Parses CSV text into typed headers and row objects correctly", () => {
    const input = 'Name,Email,Phone\r\n"Acme, Inc.",info@acme.com,"+1 555 1234"\r\nBeta Co,beta@co.com,555-9876';
    const { headers, rows } = parseCsv(input);

    expect(headers).toEqual(["Name", "Email", "Phone"]);
    expect(rows.length).toBe(2);
    expect(rows[0]["Name"]).toBe("Acme, Inc.");
    expect(rows[0]["Email"]).toBe("info@acme.com");
    expect(rows[1]["Name"]).toBe("Beta Co");
  });
});
