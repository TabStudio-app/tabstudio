import { supabase } from "./supabaseClient";

function safeJsonSizeBytes(value) {
  try {
    return new Blob([JSON.stringify(value ?? {})]).size;
  } catch {
    return 0;
  }
}

function startOfPastDaysUtc(days) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days)).toISOString();
}

export async function getAccountUsageSummary(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    return {
      tabsCreated: 0,
      exports30d: 0,
      storageUsedMb: 0,
      lastActiveLabel: "—",
    };
  }

  const [projectsCountRes, projectsRowsRes, exportEventsRes] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", normalizedUserId),
    supabase.from("projects").select("project_data, updated_at").eq("user_id", normalizedUserId).order("updated_at", { ascending: false }).limit(5000),
    supabase
      .from("export_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", normalizedUserId)
      .in("export_type", ["pdf", "png", "chord"])
      .gte("created_at", startOfPastDaysUtc(30)),
  ]);

  const tabsCreated = Number(projectsCountRes?.count || 0);
  const projectRows = Array.isArray(projectsRowsRes?.data) ? projectsRowsRes.data : [];
  const storageBytes = projectRows.reduce((sum, row) => sum + safeJsonSizeBytes(row?.project_data), 0);
  const storageUsedMb = Number((storageBytes / (1024 * 1024)).toFixed(1));
  const latestUpdatedAt = projectRows
    .map((row) => String(row?.updated_at || "").trim())
    .find((value) => value.length > 0);
  const lastActiveLabel = latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : "—";

  const exports30d = Number(exportEventsRes?.count || 0);
  return {
    tabsCreated,
    exports30d,
    storageUsedMb,
    lastActiveLabel,
  };
}

export async function recordExportEvent({ userId, exportType }) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedType = String(exportType || "").trim().toLowerCase();
  if (!normalizedUserId) return;
  if (!["pdf", "png", "chord"].includes(normalizedType)) return;

  await supabase.from("export_events").insert({
    user_id: normalizedUserId,
    export_type: normalizedType,
  });
}
