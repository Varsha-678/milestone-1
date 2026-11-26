const API_BASE = '/api';

export async function fetchViolationStats() {
  const res = await fetch(`${API_BASE}/violations/stats`);
  if (!res.ok) {
    throw new Error('Failed to fetch violation stats and dashboard analytics.');
  }
  return await res.json();
}

export async function fetchViolations(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      query.append(key, val);
    }
  });

  const res = await fetch(`${API_BASE}/violations?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch violation monitoring records.');
  }
  return await res.json();
}

export async function fetchViolationDetail(id) {
  const res = await fetch(`${API_BASE}/violations/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch violation details.');
  }
  return await res.json();
}

export async function updateViolationStatus(id, status, updatedBy = 'HSE Admin', notes = '') {
  const res = await fetch(`${API_BASE}/violations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      updated_by: updatedBy,
      notes: notes || undefined
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to update violation status.');
  }
  return await res.json();
}

export async function syncViolations() {
  const res = await fetch(`${API_BASE}/violations/sync`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Failed to synchronize violations from inspection jobs.');
  }
  return await res.json();
}

export async function fetchReportTypes() {
  const res = await fetch(`${API_BASE}/reports/types`);
  if (!res.ok) {
    throw new Error('Failed to fetch report types.');
  }
  return await res.json();
}

export async function generateReportPreview(payload) {
  const res = await fetch(`${API_BASE}/reports/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to generate report preview.');
  }
  return await res.json();
}

export function getPdfReportDownloadUrl(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      query.append(key, val);
    }
  });
  return `${API_BASE}/reports/export/pdf?${query.toString()}`;
}

export function getExcelReportDownloadUrl(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      query.append(key, val);
    }
  });
  return `${API_BASE}/reports/export/excel?${query.toString()}`;
}
