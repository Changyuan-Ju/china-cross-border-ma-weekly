import { describe, expect, it } from "vitest";
import {
  MAX_TEASER_BATCH_SIZE,
  MAX_TEASER_FILE_SIZE,
  validateTeaserFile
} from "@/lib/teasers/ingest";

describe("teaser upload limits", () => {
  it("caps each upload batch at five files", () => {
    expect(MAX_TEASER_BATCH_SIZE).toBe(5);
  });

  it("accepts supported files up to 25 MB", () => {
    expect(MAX_TEASER_FILE_SIZE).toBe(25 * 1024 * 1024);
    expect(() => validateTeaserFile("project-teaser.pdf", Buffer.from("pdf"))).not.toThrow();
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(() => validateTeaserFile("project.exe", Buffer.from("file"))).toThrow("unsupported_file_type");
    expect(() => validateTeaserFile("project.pdf", Buffer.alloc(0))).toThrow("empty_file");
    expect(() => validateTeaserFile("project.pdf", Buffer.alloc(MAX_TEASER_FILE_SIZE + 1))).toThrow("file_too_large");
  });
});
