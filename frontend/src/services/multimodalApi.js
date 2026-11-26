/**
 * SafeSight AI - Milestone 3 Multimodal RAG & Agentic Workflows API Client
 */

export async function fetchMultimodalStats() {
  const res = await fetch('/api/multimodal/stats');
  if (!res.ok) {
    throw new Error(`Failed to load multimodal statistics (${res.status})`);
  }
  return res.json();
}

export async function fetchSampleScenarios() {
  const res = await fetch('/api/multimodal/sample-scenarios');
  if (!res.ok) {
    throw new Error(`Failed to load sample scenarios (${res.status})`);
  }
  return res.json();
}

export async function fetchMultimodalSessions(limit = 20) {
  const res = await fetch(`/api/multimodal/sessions?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sessions (${res.status})`);
  }
  return res.json();
}

export async function fetchMultimodalSessionDetail(sessionId) {
  const res = await fetch(`/api/multimodal/sessions/${sessionId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch session detail (${res.status})`);
  }
  return res.json();
}

export async function analyzeMultimodal({ query, file, jobId, forceType }) {
  const formData = new FormData();
  if (query) formData.append('query', query);
  if (file) formData.append('file', file);
  if (jobId) formData.append('job_id', jobId);
  if (forceType) formData.append('force_type', forceType);

  const res = await fetch('/api/multimodal/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed (${res.status})`);
  }
  return res.json();
}

export async function chatMultimodal({ query, sessionId, jobId, mediaPath, forceType }) {
  const res = await fetch('/api/multimodal/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      session_id: sessionId || null,
      job_id: jobId || null,
      media_path: mediaPath || null,
      force_type: forceType || null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Chat query failed (${res.status})`);
  }
  return res.json();
}
