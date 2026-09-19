// Azure OpenAI chat completions (same setup as OATRx). Configured from .env only.

export function azureConfig(deploymentEnv?: string) {
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT ?? '').trim().replace(/\/+$/, '');
  const apiKey = (process.env.AZURE_OPENAI_API_KEY ?? '').trim();
  if (!endpoint || !apiKey) return null;
  const deployment = ((deploymentEnv ? process.env[deploymentEnv] : undefined)
    ?? process.env.AZURE_OPENAI_CATEGORY_DEPLOYMENT
    ?? process.env.AZURE_OPENAI_MINI_DEPLOYMENT
    ?? 'gpt-5-mini').trim();
  return { endpoint, apiKey, apiVersion: (process.env.AZURE_OPENAI_API_VERSION ?? '2025-04-01-preview').trim(), deployment };
}

export class AzureRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Sends a JSON-mode chat request and returns the parsed JSON object from the reply. */
export async function azureJsonChat(messages: unknown[], options: { deploymentEnv?: string; maxTokens?: number; timeoutMs?: number } = {}) {
  const config = azureConfig(options.deploymentEnv);
  if (!config) throw new AzureRequestError('Azure OpenAI is not configured.', 0);
  const url = `${config.endpoint}/openai/deployments/${encodeURIComponent(config.deployment)}/chat/completions?api-version=${encodeURIComponent(config.apiVersion)}`;
  const reasoning = /^(gpt-5|o\d)/i.test(config.deployment);
  const body: Record<string, unknown> = { messages, response_format: { type: 'json_object' } };
  // Reasoning deployments reject temperature and use max_completion_tokens.
  if (reasoning) { body.max_completion_tokens = options.maxTokens ?? 4000; body.reasoning_effort = 'minimal'; } else { body.max_tokens = options.maxTokens ?? 3000; body.temperature = 0; }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': config.apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
  });
  if (!response.ok) throw new AzureRequestError(`Azure OpenAI returned ${response.status}`, response.status);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new AzureRequestError('Azure OpenAI returned no JSON.', 0);
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}
