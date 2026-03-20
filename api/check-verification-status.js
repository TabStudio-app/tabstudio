import { createClient } from "@supabase/supabase-js";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function buildSupabaseAdminClient() {
  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizePlanTier(rawPlanTier) {
  const value = String(rawPlanTier || "").trim().toLowerCase();
  if (value === "solo" || value === "band" || value === "creator") return value;
  return "free";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const supabaseAdmin = buildSupabaseAdminClient();
  if (!supabaseAdmin) {
    return sendJson(res, 500, { error: "Verification status is not configured." });
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid request payload." });
  }

  const pendingAuthUserId = String(body?.pendingAuthUserId || "").trim();
  const pendingAuthEmail = String(body?.pendingAuthEmail || "").trim().toLowerCase();
  console.info("[CHECK VERIFICATION STATUS] request", {
    pendingAuthUserId,
    pendingAuthEmail,
  });

  if (!pendingAuthUserId || !pendingAuthEmail) {
    console.warn("[CHECK VERIFICATION STATUS] missing-identifier", {
      pendingAuthUserId,
      pendingAuthEmail,
    });
    return sendJson(res, 400, { error: "Pending account details are required." });
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(pendingAuthUserId);
    if (authError) {
      console.warn("[CHECK VERIFICATION STATUS] auth-lookup-failed", {
        pendingAuthUserId,
        pendingAuthEmail,
        error: String(authError?.message || authError),
      });
      return sendJson(res, 200, {
        verified: false,
        hasMembership: false,
        planTier: "free",
      });
    }

    const authUser = authData?.user || null;
    const authEmail = String(authUser?.email || "").trim().toLowerCase();
    console.info("[CHECK VERIFICATION STATUS] matched-user", {
      userId: String(authUser?.id || ""),
      authEmail,
      emailConfirmedAt: authUser?.email_confirmed_at || null,
      confirmedAt: authUser?.confirmed_at || null,
    });
    if (authEmail && authEmail !== pendingAuthEmail) {
      console.warn("[CHECK VERIFICATION STATUS] email-mismatch", {
        pendingAuthUserId,
        pendingAuthEmail,
        authEmail,
      });
      return sendJson(res, 200, {
        verified: false,
        hasMembership: false,
        planTier: "free",
      });
    }

    const emailConfirmedAt = authUser?.email_confirmed_at || authUser?.confirmed_at || null;

    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("plan_tier,membership_status")
      .eq("id", pendingAuthUserId)
      .maybeSingle();

    const planTier = normalizePlanTier(profileRow?.plan_tier);
    const hasMembership = String(profileRow?.membership_status || "").trim().toLowerCase() === "active" && planTier !== "free";
    const responsePayload = {
      verified: Boolean(emailConfirmedAt),
      emailConfirmedAt,
      confirmedAt: authUser?.confirmed_at || null,
      hasMembership,
      planTier,
    };
    console.info("[CHECK VERIFICATION STATUS] response", {
      pendingAuthUserId,
      pendingAuthEmail,
      profilePlanTier: profileRow?.plan_tier || null,
      profileMembershipStatus: profileRow?.membership_status || null,
      responsePayload,
    });

    return sendJson(res, 200, responsePayload);
  } catch (error) {
    console.error("[CHECK VERIFICATION STATUS] failed", {
      pendingAuthUserId,
      pendingAuthEmail,
      message: String(error?.message || "Unable to check verification status."),
    });
    return sendJson(res, 500, {
      error: String(error?.message || "Unable to check verification status."),
    });
  }
}
