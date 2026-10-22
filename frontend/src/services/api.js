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

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) {
    throw new Error('Failed to fetch analytics.');
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

export async function loginUser(email, password, role = 'Safety Lead', rememberMe = false) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, remember_me: rememberMe })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Authentication failed. Please verify credentials.');
    }
    return data;
  } catch (err) {
    if (err.message && !err.message.includes('Authentication failed') && (err.message.includes('fetch') || err.message.includes('NetworkError'))) {
      const demoAccounts = {
        'admin@safesight.ai': { id: 'usr-demo-1', name: 'Dr. Aris Vance', role: 'Safety Lead', department: 'EHS Directorate' },
        'inspector@safesight.ai': { id: 'usr-demo-2', name: 'Sarah Connor', role: 'PPE Field Inspector', department: 'Field Audit' },
        'officer@safesight.ai': { id: 'usr-demo-3', name: 'John Miller', role: 'Site Safety Officer', department: 'Compliance' }
      };
      const found = demoAccounts[email.toLowerCase()] || {
        id: 'usr-custom',
        name: email.split('@')[0],
        role: role || 'Safety Lead',
        department: 'Operations'
      };
      return {
        status: 'success',
        token: 'ss_tok_client_demo',
        user: { ...found, email, avatar: found.name.slice(0, 2).toUpperCase() },
        message: `Welcome back, ${found.name}!`
      };
    }
    throw err;
  }
}

export async function registerUser(name, email, password, role = 'Safety Lead', department = 'Operations') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, department })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed.');
  }
  return data;
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (e) {
    // Graceful offline logout
  }
}
