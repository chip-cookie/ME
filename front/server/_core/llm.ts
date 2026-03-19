import { ENV } from "./env";
import { DEFAULT_OPENROUTER_MODEL } from "../../shared/const";

/** LLM API 호출에 사용할 기본 타임아웃 (ms) */
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS ?? "90000", 10);

/** AbortSignal + 자동 정리 타이머를 반환합니다 */
function createTimeoutSignal(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = (useGemini = false) => {
  if (ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0) {
    return `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
  }
  if (useGemini && ENV.geminiApiKey) {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
  if (ENV.grokApiKey) {
    return "https://api.groq.com/openai/v1/chat/completions";
  }
  if (ENV.geminiApiKey) {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
  return "https://forge.manus.im/v1/chat/completions";
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey && !ENV.grokApiKey && !ENV.geminiApiKey) {
    throw new Error("API Key is not configured (requires GROK_API_KEY, GEMINI_API_KEY, or BUILT_IN_FORGE_API_KEY)");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

/**
 * Invoke local vLLM server for style analysis (primary for style tasks)
 * Uses OpenAI-compatible API format
 */
export async function invokeVLLM(params: {
  messages: Message[];
  temperature?: number;
}): Promise<InvokeResult> {
  const url = `${ENV.vllmBaseUrl}/v1/chat/completions`;
  const model = ENV.vllmModel;

  const payload = {
    model,
    messages: params.messages.map(normalizeMessage),
    temperature: params.temperature ?? 0.7,
    max_tokens: 2048,
  };

  const { signal, clear } = createTimeoutSignal(LLM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[vLLM] Request failed: ${response.status} - ${errorText}`);
      throw new Error(`vLLM request failed: ${response.status}`);
    }

    return (await response.json()) as InvokeResult;
  } catch (error) {
    console.warn("[vLLM] Connection failed, will fallback to Gemini:", error);
    throw error;
  } finally {
    clear();
  }
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  // Use Gemini as primary, Groq as fallback
  const model = ENV.geminiApiKey ? "gemini-2.0-flash" : "llama-3.3-70b-versatile";
  // Note: For Groq, typical models are "llama3-70b-8192", "mixtral-8x7b-32768". Using a safe default.
  // The user asked to use Grok (xAI) or Groq? 
  // "gsk_..." looks like a Groq API key (starts with gsk_).
  // Groq models: llama3-8b-8192, llama3-70b-8192, mixtral-8x7b-32768, gemma-7b-it
  // Let's use "llama3-70b-8192" as a high-quality default for Groq.

  const payload: Record<string, unknown> = {
    model: ENV.geminiApiKey ? "gemini-2.0-flash" : "llama-3.3-70b-versatile",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Remove thinking/max_tokens specific to Gemini if using Groq
  if (!ENV.grokApiKey) {
    payload.max_tokens = 32768
    payload.thinking = {
      "budget_tokens": 128
    }
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  // Helper function to make request
  const makeRequest = async (useGroq: boolean) => {
    let apiKey: string;
    let model: string;

    // Clone payload to avoid mutating original
    const requestPayload = { ...payload };

    if (useGroq && ENV.grokApiKey) {
      // Fallback to Groq
      apiKey = ENV.grokApiKey;
      model = "llama-3.3-70b-versatile";
      requestPayload.model = model;
      // Groq doesn't support json_schema - remove it
      delete requestPayload.response_format;
      delete requestPayload.thinking;
    } else if (ENV.geminiApiKey) {
      // Primary: Gemini
      apiKey = ENV.geminiApiKey;
      model = "gemini-2.0-flash";
      requestPayload.model = model;
      delete requestPayload.thinking;
    } else if (ENV.grokApiKey) {
      apiKey = ENV.grokApiKey;
      model = "llama-3.3-70b-versatile";
      requestPayload.model = model;
      // Groq doesn't support json_schema - remove it
      delete requestPayload.response_format;
      delete requestPayload.thinking;
    } else {
      apiKey = ENV.forgeApiKey;
    }

    const url = useGroq ? "https://api.groq.com/openai/v1/chat/completions"
      : ENV.geminiApiKey ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        : resolveApiUrl(false);

    const { signal, clear } = createTimeoutSignal(LLM_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
        signal,
      });
    } finally {
      clear();
    }
  };

  // Try Gemini first, fallback to Groq on rate limit (429)
  let response = await makeRequest(false);

  // If Gemini returns 429 (rate limit), try Groq
  if (response.status === 429 && ENV.grokApiKey) {
    console.log("[LLM] Gemini rate limited. Falling back to Groq...");
    response = await makeRequest(true);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}

/**
 * 사용자의 OpenRouter API 키로 LLM을 호출합니다.
 * OpenRouter는 OpenAI 호환 API이며 100+ 모델을 지원합니다.
 * @see https://openrouter.ai/docs
 */
export async function invokeOpenRouter(
  params: InvokeParams,
  apiKey: string,
  model: string = DEFAULT_OPENROUTER_MODEL
): Promise<InvokeResult> {
  const { messages, outputSchema, output_schema, responseFormat, response_format } = params;

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(normalizeMessage),
  };

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat, response_format, outputSchema, output_schema,
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const { signal, clear } = createTimeoutSignal(LLM_TIMEOUT_MS);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "http-referer": "https://jasos.app",
        "x-title": "JasoS",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter 호출 실패: ${response.status} – ${errorText}`);
    }

    return (await response.json()) as InvokeResult;
  } finally {
    clear();
  }
}
