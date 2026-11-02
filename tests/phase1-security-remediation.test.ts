import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { getSessionSecret, createSessionToken, verifySessionToken } from "../src/lib/auth";
import LoginPage from "../src/app/(auth)/login/page";
import fs from "fs";
import path from "path";

// Mock next/navigation for SSR rendering in tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

function setNodeEnv(env: string) {
  Object.defineProperty(process.env, "NODE_ENV", {
    value: env,
    configurable: true,
    writable: true,
  });
}

describe("Phase 1 Security Remediation — SEC-01 & SEC-02", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Finding SEC-01: SESSION_SECRET Fail-Closed Enforcement & Fallback Elimination", () => {
    it("Rejects missing secret in production (fails closed)", async () => {
      setNodeEnv("production");
      delete process.env.SESSION_SECRET;

      expect(() => getSessionSecret()).toThrowError(
        /FATAL: SESSION_SECRET environment variable is missing in production/i
      );

      await expect(
        createSessionToken({
          userId: "usr_test_123",
          workspaceId: "ws_test_123",
          email: "test@vendre.com",
        })
      ).rejects.toThrowError(/FATAL: SESSION_SECRET/i);
    });

    it("Rejects a secret shorter than 32 characters in production", async () => {
      setNodeEnv("production");
      process.env.SESSION_SECRET = "too_short_key_under_32_bytes";

      expect(() => getSessionSecret()).toThrowError(
        /FATAL: SESSION_SECRET is too short in production/i
      );

      await expect(
        createSessionToken({
          userId: "usr_test_123",
          workspaceId: "ws_test_123",
          email: "test@vendre.com",
        })
      ).rejects.toThrowError(/FATAL: SESSION_SECRET/i);
    });

    it("Accepts a valid secret (>= 32 characters) and correctly signs/verifies tokens", async () => {
      setNodeEnv("production");
      process.env.SESSION_SECRET =
        "vendre_production_cryptographic_signing_key_strictly_above_32_characters_long_987654";

      const secretKey = getSessionSecret();
      expect(secretKey).toBeInstanceOf(Uint8Array);
      expect(secretKey.length).toBeGreaterThanOrEqual(32);

      const token = await createSessionToken({
        userId: "usr_prod_verified",
        workspaceId: "ws_prod_verified",
        email: "verified@vendre.com",
      });

      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // Standard JWT header.payload.signature

      const verifiedPayload = await verifySessionToken(token);
      expect(verifiedPayload).not.toBeNull();
      expect(verifiedPayload?.userId).toBe("usr_prod_verified");
      expect(verifiedPayload?.workspaceId).toBe("ws_prod_verified");
      expect(verifiedPayload?.email).toBe("verified@vendre.com");
    });

    it("Ensures no hardcoded fallback secret can silently sign production tokens", async () => {
      setNodeEnv("production");
      delete process.env.SESSION_SECRET;

      // Attempting to sign without SESSION_SECRET must never produce a valid fallback token
      await expect(
        createSessionToken({
          userId: "usr_attacker",
          workspaceId: "ws_victim",
          email: "attacker@vendre.com",
        })
      ).rejects.toThrow();

      // Read auth.ts source code to verify no default secret fallback string remains
      const authSource = fs.readFileSync(path.resolve(__dirname, "../src/lib/auth.ts"), "utf-8");
      expect(authSource).not.toContain("vendre_crm_super_secure_development_secret_key");
      expect(authSource).not.toMatch(/process\.env\.SESSION_SECRET\s*\|\|\s*["']/);
    });
  });

  describe("Finding SEC-02: Demo Credentials Isolation & Normal Login Functional", () => {
    it("Renders demo controls in development environment", () => {
      setNodeEnv("development");
      const html = renderToString(React.createElement(LoginPage));

      expect(html).toContain("One-Click Demo Credentials");
      expect(html).toContain("owner@vendre.com");
      expect(html).toContain("admin@vendre.com");
      expect(html).toContain("sales@vendre.com");
      expect(html).toContain("agency.lead@...</div>");
      expect(html).toContain("Vendre2025!");
    });

    it("Completely excludes demo controls and passwords from production output", () => {
      setNodeEnv("production");
      const html = renderToString(React.createElement(LoginPage));

      expect(html).not.toContain("One-Click Demo Credentials");
      expect(html).not.toContain("One-Click Demo");
      expect(html).not.toContain("Vendre2025!");
      expect(html).not.toContain("Default password:");
      expect(html).not.toContain("owner@vendre.com");
      expect(html).not.toContain("admin@vendre.com");

      // Verify normal login form fields are still present
      expect(html).toContain("Email Address");
      expect(html).toContain("Password");
      expect(html).toContain("Sign In to Workspace");
    });

    it("Normal login remains functional via the authentication API", async () => {
      // Test the API handler with real seed credentials
      const { POST } = await import("../src/app/api/auth/login/route");

      // Positive case: correct credentials
      const validReq = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@vendre.com",
          password: "Vendre2025!",
        }),
      });

      const validRes = await POST(validReq);
      expect(validRes.status).toBe(200);
      const validData = await validRes.json();
      expect(validData.success).toBe(true);
      expect(validData.user.email).toBe("owner@vendre.com");

      // Negative case: wrong password
      const invalidReq = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@vendre.com",
          password: "IncorrectPassword!",
        }),
      });

      const invalidRes = await POST(invalidReq);
      expect(invalidRes.status).toBe(401);
      const invalidData = await invalidRes.json();
      expect(invalidData.error).toBe("Invalid email or password.");
    });
  });
});

