import { supabase } from "./supabaseClient";

async function requireAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user?.id) throw new Error("You must be signed in to access projects.");

  return user;
}

export async function createProject({ title = "", artist = "", album = "", projectData = {} }) {
  const user = await requireAuthenticatedUser();
  const payload = {
    user_id: user.id,
    title: String(title || "").trim(),
    artist: String(artist || "").trim() || null,
    album: String(album || "").trim() || null,
    project_data: projectData,
  };

  const { data, error } = await supabase.from("projects").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function getUserProjects() {
  await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, artist, album, project_data, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProjectById(projectId) {
  const id = String(projectId || "").trim();
  if (!id) throw new Error("Project id is required.");

  await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, artist, album, project_data, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(projectId, { title = "", artist = "", album = "", projectData = {} }) {
  const id = String(projectId || "").trim();
  if (!id) throw new Error("Project id is required.");

  await requireAuthenticatedUser();
  const payload = {
    title: String(title || "").trim(),
    artist: String(artist || "").trim() || null,
    album: String(album || "").trim() || null,
    project_data: projectData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("projects").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}
