import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getSession } from "@/app/_lib/session";
import type { NextRequest } from "next/server";

interface ReportErrorBody {
  errorMessage?: string;
  correlationId?: string;
  sessionId?: string;
  context?: string;
}

const isMockMode =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true" ||
  process.env.RESTAURANT_DATA_PROVIDER !== "swiggy";

const fallbackResponse = (correlationId: string) =>
  Response.json({
    success: true,
    reportId: correlationId,
    fallback: true,
  });

async function getSwiggyToken() {
  try {
    const session = await getSession();
    if (
      session.swiggyToken &&
      (!session.tokenExpiry || session.tokenExpiry > Date.now())
    ) {
      return session.swiggyToken;
    }
  } catch {
    // The reporter must stay quiet even when OAuth sessions are not configured.
  }

  return process.env.SWIGGY_TOKEN || "";
}

interface McpTextContent {
  type: string;
  text?: string;
}

function extractReportText(response: Awaited<ReturnType<Client["callTool"]>>) {
  const content = Array.isArray(response.content)
    ? (response.content as McpTextContent[])
    : [];
  const textContent = content.find(
    (content) => content.type === "text" && "text" in content
  );

  if (!textContent?.text) {
    return "Swiggy issue report submitted.";
  }

  try {
    const parsed = JSON.parse(textContent.text);
    const report = parsed.data?.report || parsed.report || parsed.data;
    return typeof report === "string" ? report : JSON.stringify(report);
  } catch {
    return textContent.text;
  }
}

export async function POST(req: NextRequest) {
  let correlationId = `ERR_${Date.now()}`;

  try {
    const body = (await req.json()) as ReportErrorBody;
    const {
      errorMessage = "Unknown SnapOrder error",
      sessionId,
      context = "unspecified",
    } = body;

    correlationId = body.correlationId || correlationId;

    if (isMockMode) {
      return fallbackResponse(correlationId);
    }

    const swiggyToken = await getSwiggyToken();
    if (!swiggyToken) {
      return fallbackResponse(correlationId);
    }

    const client = new Client(
      { name: "snaporder-error-reporter", version: "0.1.0" },
      { capabilities: {} }
    );
    const transport = new StreamableHTTPClientTransport(
      new URL("https://mcp.swiggy.com/food"),
      {
        requestInit: {
          headers: { Authorization: `Bearer ${swiggyToken}` },
        },
      }
    );

    await client.connect(transport);

    try {
      const response = await client.callTool({
        name: "report_error",
        arguments: {
          error_message: errorMessage,
          context: `SnapOrder | ${correlationId} | ${
            sessionId ?? "unknown"
          } | ${context}`,
        },
      });

      return Response.json({
        success: true,
        report: extractReportText(response),
        reportId: correlationId,
      });
    } finally {
      await client.close();
    }
  } catch {
    return fallbackResponse(correlationId);
  }
}
