import { afterEach, describe, expect, it } from "vitest";
import {
  createTeaserSessionToken,
  DEFAULT_TEASER_USERNAME,
  teaserAuthIsConfigured,
  verifyTeaserCredentials,
  verifyTeaserSessionToken
} from "@/lib/teasers/auth";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});
describe("teaser authentication", () => {
  it("validates configured credentials and signed sessions", () => {
    process.env.TEASER_ADMIN_USERNAME = DEFAULT_TEASER_USERNAME;
    process.env.TEASER_ADMIN_PASSWORD = "unit-test-password";
    process.env.TEASER_AUTH_SECRET = "unit-test-secret-with-more-than-32-characters";

    expect(teaserAuthIsConfigured()).toBe(true);
    expect(verifyTeaserCredentials(DEFAULT_TEASER_USERNAME, "unit-test-password")).toBe(true);
    expect(verifyTeaserCredentials(DEFAULT_TEASER_USERNAME, "wrong-password")).toBe(false);

    const token = createTeaserSessionToken();
    expect(verifyTeaserSessionToken(token)?.username).toBe(DEFAULT_TEASER_USERNAME);
    expect(verifyTeaserSessionToken(`${token}tampered`)).toBeNull();
  });
});
