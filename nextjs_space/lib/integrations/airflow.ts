/**
 * M12 – Airflow REST Integration
 *
 * Thin client bọc Airflow REST API v1 (Apache Airflow >= 2.0).
 * Mọi call đều có timeout 10s và structured error — không throw raw network error.
 *
 * Khi AIRFLOW_BASE_URL không được set (dev / test không có Airflow),
 * client trả mock response thay vì throw — giúp app vẫn chạy được.
 *
 * Doc: https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html
 */

// ─── Config ───────────────────────────────────────────────────────────────────

function getAirflowConfig() {
  return {
    baseUrl:  process.env.AIRFLOW_BASE_URL  ?? '',
    username: process.env.AIRFLOW_USERNAME  ?? 'airflow',
    password: process.env.AIRFLOW_PASSWORD  ?? '',
    timeout:  10_000,
  };
}

function isConfigured(): boolean {
  return !!process.env.AIRFLOW_BASE_URL;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AirflowDagRunInfo {
  dagId:         string;
  dagRunId:      string;
  state:         'queued' | 'running' | 'success' | 'failed';
  startDate:     string | null;
  endDate:       string | null;
  logicalDate:   string;
  externalTrigger: boolean;
}

export interface TriggerDagInput {
  dagId:        string;
  dagRunId?:    string;   // custom run id, default: gerado automaticamente
  conf?:        Record<string, unknown>;  // parâmetros para o DAG
  logicalDate?: string;   // ISO 8601, default: now
}

export interface AirflowTriggerResult {
  triggered:   boolean;
  dagRunId:    string;
  state:       string;
  mockMode:    boolean;  // true nếu Airflow chưa được config
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function airflowFetch<T>(
  method:  'GET' | 'POST' | 'PATCH',
  path:    string,
  body?:   unknown,
): Promise<T> {
  const cfg = getAirflowConfig();
  const url = `${cfg.baseUrl}/api/v1${path}`;

  const credentials = Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeout);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/json',
      },
      body:   body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Airflow API ${method} ${path} → HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Trigger một DAG run. Nếu Airflow chưa config, trả mock thay vì throw.
 */
export async function triggerDag(input: TriggerDagInput): Promise<AirflowTriggerResult> {
  if (!isConfigured()) {
    const mockRunId = input.dagRunId ?? `mock_${input.dagId}_${Date.now()}`;
    console.warn(`[airflow] AIRFLOW_BASE_URL not set — mock trigger for ${input.dagId}`);
    return { triggered: true, dagRunId: mockRunId, state: 'queued', mockMode: true };
  }

  const dagRunId = input.dagRunId ?? `app_trigger_${Date.now()}`;
  const payload = {
    dag_run_id:   dagRunId,
    conf:         input.conf ?? {},
    logical_date: input.logicalDate ?? new Date().toISOString(),
  };

  const result = await airflowFetch<{
    dag_run_id: string;
    state:      string;
  }>('POST', `/dags/${input.dagId}/dagRuns`, payload);

  return {
    triggered: true,
    dagRunId:  result.dag_run_id,
    state:     result.state,
    mockMode:  false,
  };
}

/**
 * Lấy trạng thái của một DAG Run cụ thể.
 */
export async function getDagRunStatus(
  dagId:    string,
  dagRunId: string,
): Promise<AirflowDagRunInfo | null> {
  if (!isConfigured()) return null;

  try {
    const result = await airflowFetch<{
      dag_id:          string;
      dag_run_id:      string;
      state:           string;
      start_date:      string | null;
      end_date:        string | null;
      logical_date:    string;
      external_trigger: boolean;
    }>('GET', `/dags/${dagId}/dagRuns/${dagRunId}`);

    return {
      dagId:           result.dag_id,
      dagRunId:        result.dag_run_id,
      state:           result.state as AirflowDagRunInfo['state'],
      startDate:       result.start_date,
      endDate:         result.end_date,
      logicalDate:     result.logical_date,
      externalTrigger: result.external_trigger,
    };
  } catch {
    return null;
  }
}

/**
 * Lấy trạng thái tổng của một DAG (không phải một run cụ thể).
 */
export async function getDagStatus(dagId: string): Promise<{
  isPaused:    boolean;
  isActive:    boolean;
  lastParsed:  string | null;
} | null> {
  if (!isConfigured()) return null;

  try {
    const result = await airflowFetch<{
      is_paused: boolean;
      is_active: boolean;
      last_parsed_time: string | null;
    }>('GET', `/dags/${dagId}`);

    return {
      isPaused:   result.is_paused,
      isActive:   result.is_active,
      lastParsed: result.last_parsed_time,
    };
  } catch {
    return null;
  }
}

/**
 * Unpause một DAG (cần để trigger lần đầu sau khi deploy).
 */
export async function unpauseDag(dagId: string): Promise<void> {
  if (!isConfigured()) return;
  await airflowFetch('PATCH', `/dags/${dagId}`, { is_paused: false });
}
