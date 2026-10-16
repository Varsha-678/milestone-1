const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error('Failed to reach backend health endpoint.');
  }
  return await res.json();
}

export async function analyzeFile(file, confThreshold = 0.25, requiredPPE = ['helmet', 'vest']) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conf_threshold', confThreshold.toString());
  formData.append('required_ppe', requiredPPE.join(','));

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Analysis request failed.');
  }
  return data;
}

export async function fetchJobs() {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) {
    throw new Error('Failed to fetch inspection history.');
  }
  return await res.json();
}

export async function fetchJobDetail(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch inspection details.');
  }
  return await res.json();
}

export async function deleteJob(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Failed to delete record.');
  }
  return await res.json();
}

export function getReportDownloadUrl(jobId) {
  return `${API_BASE}/jobs/${jobId}/report`;
}
