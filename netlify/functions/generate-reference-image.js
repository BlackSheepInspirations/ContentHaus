/**
 * Netlify Function: generate-reference-image
 *
 * Takes the assembled text prompt from Image/Prompt Reference Mode (Content
 * Haus and Graphics Haus), plus an optional reference photo, and generates
 * an image directly via Gemini 2.5 Flash Image ("Nano Banana") — the same
 * model handles reading the reference photo AND producing the new image in
 * one call, so no separate vision-analysis step is needed.
 *
 * The GEMINI_API_KEY is read from a Netlify environment variable — it is
 * never present in any file in this repo and never reaches the browser.
 *
 * Request body (POST, JSON):
 *   { prompt: string, image?: string /* data:<mime>;base64,<data> * / }
 * Response (JSON):
 *   200 { image: string /* data URL of the generated image * / }
 *   4xx/5xx { error: string }
 */

var GEMINI_MODEL = "gemini-2.5-flash-image";
var GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  GEMINI_MODEL +
  ":generateContent";

// Conservative cap on the incoming base64 image payload (~5MB decoded) —
// keeps a single request from ballooning cost/latency or abusing the
// free-tier quota this function shares with every visitor.
var MAX_IMAGE_BASE64_LENGTH = 7 * 1024 * 1024;

function corsHeaders() {
  // Locked to the store's own origin once ALLOWED_ORIGIN is set as a
  // Netlify env var; falls back to "*" only for initial local testing.
  var origin = process.env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode: statusCode,
    headers: Object.assign({ "Content-Type": "application/json" }, corsHeaders()),
    body: JSON.stringify(payload),
  };
}

function parseDataUrl(dataUrl) {
  var match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse(500, { error: "Server is not configured with a Gemini API key yet." });
  }

  var body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }

  var prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return jsonResponse(400, { error: "A prompt is required to generate an image." });
  }

  var parts = [{ text: prompt }];

  if (body.image) {
    var parsed = parseDataUrl(body.image);
    if (!parsed) {
      return jsonResponse(400, { error: "Reference image must be a base64 data URL." });
    }
    if (parsed.data.length > MAX_IMAGE_BASE64_LENGTH) {
      return jsonResponse(413, { error: "Reference image is too large. Please use a smaller file." });
    }
    parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.data } });
  }

  var upstreamResponse;
  try {
    upstreamResponse = await fetch(GEMINI_ENDPOINT + "?key=" + process.env.GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: parts }] }),
    });
  } catch (e) {
    return jsonResponse(502, { error: "Could not reach the image generation service. Please try again." });
  }

  var upstreamJson;
  try {
    upstreamJson = await upstreamResponse.json();
  } catch (e) {
    return jsonResponse(502, { error: "Received an unreadable response from the image generation service." });
  }

  if (!upstreamResponse.ok) {
    var upstreamMessage = (upstreamJson && upstreamJson.error && upstreamJson.error.message) || "Image generation failed.";
    return jsonResponse(upstreamResponse.status >= 400 && upstreamResponse.status < 500 ? 400 : 502, { error: upstreamMessage });
  }

  var candidateParts = (upstreamJson.candidates && upstreamJson.candidates[0] && upstreamJson.candidates[0].content && upstreamJson.candidates[0].content.parts) || [];

  var imagePart = candidateParts.filter(function (p) { return p.inlineData || p.inline_data; })[0];
  if (!imagePart) {
    return jsonResponse(422, { error: "The generator didn't return an image for this prompt — try adjusting it and generating again." });
  }

  var inline = imagePart.inlineData || imagePart.inline_data;
  var mimeType = inline.mimeType || inline.mime_type || "image/png";
  var data = inline.data;

  return jsonResponse(200, { image: "data:" + mimeType + ";base64," + data });
};
