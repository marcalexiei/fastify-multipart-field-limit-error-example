# `fastify-multipart-field-limit-error-example`

I’m using `@fastify/multipart` with `zod` validation to handle `multipart/form-data`.
My goal: limit both field and file size to 15 bytes.
Example setup:

<https://github.com/marcalexiei/fastify-multipart-field-limit-error-example/blob/a86bef359ab818b57f7205cb3dfb1ba10cb10ea1/src/app.ts#L16>

<https://github.com/marcalexiei/fastify-multipart-field-limit-error-example/blob/a86bef359ab818b57f7205cb3dfb1ba10cb10ea1/src/app.ts#L82-L93>

When a file exceeds this limit, I get the expected `RequestFileTooLargeError`:

<https://github.com/marcalexiei/fastify-multipart-field-limit-error-example/blob/a86bef359ab818b57f7205cb3dfb1ba10cb10ea1/test/test-upload.ts#L31-L40>

## Problem

If a field exceeds the limit, it’s silently truncated and passed to the validator — no error is thrown.

### Reproduction

```sh
pnpm i
```

```sh
pnpm dev
```

```sh
curl -X 'POST' \
  'http://localhost:5174/testing-multi-part' \
  -H 'accept: */*' \
  -H 'Content-Type: multipart/form-data' \
  -F 'html=abcdefghlmnopqrstuvz' \
  -F 'anotherField={"mood":[]}'
```

You can see that `body.html` is stripped:

```json
{
  "status": "ok",
  "body": {
    "html": "abcdefghlmnopqr",
    "anotherField": {
      "mood": []
    }
  }
}
```

You can also reproduce via Swagger UI: <http://localhost:5174/documentation#/default/post_testing_multi_part>

## Run test

```sh
pnpm test
```

This test shows the behavior of fields exceeding the limit:
it returns the field value stripped as previously described
and the assertion at line 65 fails because the http status is 200.

<https://github.com/marcalexiei/fastify-multipart-field-limit-error-example/blob/a86bef359ab818b57f7205cb3dfb1ba10cb10ea1/test/test-upload.ts#L57-L67>

### Proposed behavior

I’d like the same behavior as with files:
Throw an error (similar to `RequestFileTooLargeError`) when a field exceeds the configured size limit.

---

If this behavior is intentional,
is there a recommended way to hook into the parsing process to throw an error for oversized fields?
