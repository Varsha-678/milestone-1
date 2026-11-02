const API_BASE = '/api/documents';

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}`);
  if (!res.ok) throw new Error('Failed to fetch document catalog.');
  return await res.json();
}

export async function fetchDocumentStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch knowledge base statistics.');
  return await res.json();
}

export async function fetchDocumentDetail(docId) {
  const res = await fetch(`${API_BASE}/${docId}`);
  if (!res.ok) throw new Error('Failed to fetch document details.');
  return await res.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Document upload failed.');
  }

  return await res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document.');
  return await res.json();
}

export async function searchDocuments({ query, documentId = null, limit = 10 }) {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      document_id: documentId,
      limit,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Semantic search failed.');
  }

  return await res.json();
}

export async function fetchViolationReports() {
  const res = await fetch(`${API_BASE}/reports/violations`);
  if (!res.ok) throw new Error('Failed to fetch safety violation reports.');
  return await res.json();
}

export async function addSafetyRecommendation(data) {
  const res = await fetch(`${API_BASE}/reports/violations/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit recommendation.');
  }

  return await res.json();
}
