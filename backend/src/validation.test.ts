import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateMaterial } from "./validation";

describe("validateMaterial", () => {
  it("accepts valid material payload and trims whitespace", () => {
    const result = validateMaterial({
      title: "  Лабораторна №3: CI/CD  ",
      subject: "DevOps",
      category: "Лабораторна робота",
      author: "Дмитро",
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.data, {
      title: "Лабораторна №3: CI/CD",
      subject: "DevOps",
      category: "Лабораторна робота",
      author: "Дмитро",
    });
  });

  it("rejects payload with missing required fields", () => {
    const result = validateMaterial({
      title: "Конспект",
      subject: "",
      category: "Конспект",
      author: "Дмитро",
    });

    assert.equal(result.valid, false);
    assert.equal(result.error, "All fields are required");
  });

  it("rejects unsupported category", () => {
    const result = validateMaterial({
      title: "Лекція 1",
      subject: "DevOps",
      category: "Інше",
      author: "Дмитро",
    });

    assert.equal(result.valid, false);
    assert.equal(result.error, "Invalid category");
  });

  it("rejects title longer than 200 characters", () => {
    const result = validateMaterial({
      title: "A".repeat(201),
      subject: "DevOps",
      category: "Конспект",
      author: "Дмитро",
    });

    assert.equal(result.valid, false);
    assert.equal(result.error, "Title is too long");
  });
});