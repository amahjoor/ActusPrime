import test from "node:test";
import assert from "node:assert/strict";
import { markdownToSpeechText } from "./markdownToSpeech.js";

test("strips headings, emphasis, and blockquotes", () => {
  const input = "# Title\n> **Bold** _text_";
  const output = markdownToSpeechText(input);

  assert.equal(output, "Title Bold text");
});

test("keeps readable link and image labels", () => {
  const input = "Read [docs](https://example.com) and ![diagram](https://img.com/a.png)";
  const output = markdownToSpeechText(input);

  assert.equal(output, "Read docs and diagram");
});

test("removes list markers and checkboxes", () => {
  const input = "- [x] First item\n- Second item\n1. Third item";
  const output = markdownToSpeechText(input);

  assert.equal(output, "First item Second item Third item");
});

test("unwraps fenced and inline code markers", () => {
  const input = "Use `npm test`\n\n```bash\necho hello\n```";
  const output = markdownToSpeechText(input);

  assert.equal(output, "Use npm test. echo hello");
});

test("returns empty string for non-string input", () => {
  const output = markdownToSpeechText(null);

  assert.equal(output, "");
});
