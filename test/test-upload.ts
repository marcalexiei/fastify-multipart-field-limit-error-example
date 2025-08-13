import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.ts";
import type { FastifyInstance } from "fastify";

const port = 5173;
let app: FastifyInstance;

before(async () => {
  app = await createApp();
  await app.ready();
  await app.listen({ port });
});

after(() => app.close());

const SERVER_URL = `http://localhost:${port}/testing-multi-part`;

describe("file", () => {
  it("should accept files within limit", async (t) => {
    const form = new FormData();
    form.append("html", new Blob(["ciao"]));

    const res = await fetch(SERVER_URL, { method: "POST", body: form });
    const json = await res.json();

    assert.equal(res.status, 200);
    assert.equal(json.status, "ok");
  });

  it("should NOT accept files within limit", async (t) => {
    const form = new FormData();
    form.append("html", new Blob(["x".repeat(100_000)]));

    const res = await fetch(SERVER_URL, { method: "POST", body: form });
    const json = await res.json();

    assert.equal(res.status, 413);
    assert.equal(json.code, "FST_REQ_FILE_TOO_LARGE");
    assert.equal(json.message, "request file too large");
  });
});

describe("fields", () => {
  it("should accept fields within limit", async (t) => {
    const form = new FormData();
    const html = "ciao";
    form.append("html", html);

    const res = await fetch(SERVER_URL, { method: "POST", body: form });
    const json = await res.json();

    assert.equal(res.status, 200);
    t.assert.snapshot(json.body);
  });

  it("should NOT accept fields exceeding the limit", async (t) => {
    const form = new FormData();
    const html = "x".repeat(100_000);
    form.append("html", html);

    const res = await fetch(SERVER_URL, { method: "POST", body: form });
    const json = await res.json();

    assert.equal(res.status, 413);
    t.assert.snapshot(json);
  });
});
