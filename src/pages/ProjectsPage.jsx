import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteProject,
  deleteProjectsByAlbum,
  deleteProjectsByArtist,
  renameProjectsAlbum,
  renameProjectsArtist,
  updateProject,
} from "../lib/projects";
import { supabase } from "../lib/supabaseClient";
import { buttonMicro, cardDense, menuItem, menuItemSelected } from "../utils/uiTokens";

function makeLegacyProjectKey(artist, album, title) {
  return [artist, album, title].map((value) => String(value || "").trim().toLowerCase()).join("::");
}

export default function ProjectsPage({ shared }) {
  const PROJECTS_HEADER_CLEARANCE = 66;
  const PROJECTS_SECTION_GAP = 12;
  const DELETE_WAIT_SECONDS = 10;
  const {
    actionDeleteBtn,
    actionEditBtn,
    btnSecondary,
    EditIcon,
    field,
    projectsLibraryOpen,
    setProjectsLibraryOpen,
    setSelectedLibraryAlbumName,
    setSelectedLibraryArtistKey,
    setSelectedLibrarySongName,
    setAlbumName,
    setArtist,
    selectedLibraryArtistLabel,
    selectedLibraryAlbumName,
    selectedLibrarySongName,
    currentProjectId,
    userProjects,
    projectActionBusyId,
    refreshUserProjects,
    openSupabaseProject,
    THEME,
    withAlpha,
  } = shared;

  const [searchQuery, setSearchQuery] = useState("");
  const [busyActionKey, setBusyActionKey] = useState("");
  const [dialogState, setDialogState] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoadError, setLibraryLoadError] = useState("");
  const [libraryRecords, setLibraryRecords] = useState({
    artists: [],
    albums: [],
    songs: [],
  });

  const denseCard = cardDense(THEME);
  const microButton = buttonMicro(THEME);
  const searchControlHeight = field.height ?? 42;
  const libraryColumnHeight = "min(640px, calc(100vh - 180px))";
  const selectorRowStyle = menuItem(THEME, { padding: "0 10px", borderRadius: 12, height: 38, fontWeight: 850 });
  const selectorRowSelectedStyle = menuItemSelected(THEME, {
    padding: "0 10px",
    borderRadius: 12,
    height: 38,
    fontWeight: 850,
  });

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchActive = normalizedSearchQuery.length > 0;

  const legacyProjectIdByKey = useMemo(() => {
    const map = new Map();
    (Array.isArray(userProjects) ? userProjects : []).forEach((project) => {
      const title = String(project?.title || "").trim();
      const artist = String(project?.artist || "").trim();
      const album = String(project?.album || "").trim();
      if (!title || !artist || !album) return;
      map.set(makeLegacyProjectKey(artist, album, title), String(project?.id || ""));
    });
    return map;
  }, [userProjects]);

  const phaseBArtists = useMemo(
    () =>
      (Array.isArray(libraryRecords.artists) ? libraryRecords.artists : [])
        .map((artist) => ({
          id: String(artist?.id || ""),
          name: String(artist?.name || "").trim(),
        }))
        .filter((artist) => artist.id && artist.name),
    [libraryRecords.artists]
  );

  const phaseBAlbums = useMemo(
    () =>
      (Array.isArray(libraryRecords.albums) ? libraryRecords.albums : [])
        .map((album) => ({
          id: String(album?.id || ""),
          artistId: String(album?.artist_id || ""),
          title: String(album?.title || "").trim(),
        }))
        .filter((album) => album.id && album.title),
    [libraryRecords.albums]
  );

  const artistNameById = useMemo(() => {
    const map = new Map();
    phaseBArtists.forEach((artist) => {
      map.set(artist.id, artist.name);
    });
    return map;
  }, [phaseBArtists]);

  const albumById = useMemo(() => {
    const map = new Map();
    phaseBAlbums.forEach((album) => {
      map.set(album.id, album);
    });
    return map;
  }, [phaseBAlbums]);

  const savedProjects = useMemo(
    () =>
      (Array.isArray(libraryRecords.songs) ? libraryRecords.songs : [])
        .map((song) => {
          const songId = String(song?.id || "");
          const albumId = String(song?.album_id || "");
          const albumRecord = albumById.get(albumId) || null;
          const artistId = String(albumRecord?.artistId || "");
          const artistName = artistNameById.get(artistId) || "";
          const albumName = String(albumRecord?.title || "").trim();
          const title = String(song?.title || "").trim();
          return {
            id: songId,
            legacyProjectId: legacyProjectIdByKey.get(makeLegacyProjectKey(artistName, albumName, title)) || "",
            title,
            artist: artistName,
            artistId,
            album: albumName,
            albumId,
            updated_at: String(song?.updated_at || ""),
            project_data:
              song?.project_data && typeof song.project_data === "object"
                ? song.project_data
                : {},
          };
        })
        .filter((project) => project.id),
    [albumById, artistNameById, legacyProjectIdByKey, libraryRecords.songs]
  );

  const searchableProjects = useMemo(
    () =>
      savedProjects.filter((project) =>
        !searchActive ? true : [project.artist, project.album, project.title].join(" ").toLowerCase().includes(normalizedSearchQuery)
      ),
    [normalizedSearchQuery, savedProjects, searchActive]
  );

  const visibleArtists = useMemo(
    () =>
      phaseBArtists.filter((artist) => {
        if (!searchActive) return true;
        if (artist.name.toLowerCase().includes(normalizedSearchQuery)) return true;
        if (
          phaseBAlbums.some(
            (album) => album.artistId === artist.id && album.title.toLowerCase().includes(normalizedSearchQuery)
          )
        ) {
          return true;
        }
        return searchableProjects.some((project) => project.artistId === artist.id);
      }),
    [normalizedSearchQuery, phaseBAlbums, phaseBArtists, searchActive, searchableProjects]
  );

  const visibleAlbums = useMemo(() => {
    if (!selectedLibraryArtistLabel) return [];
    const selectedArtist = phaseBArtists.find((artist) => artist.name === selectedLibraryArtistLabel);
    if (!selectedArtist) return [];
    return phaseBAlbums.filter((album) => {
      if (album.artistId !== selectedArtist.id) return false;
      if (!searchActive) return true;
      if (album.title.toLowerCase().includes(normalizedSearchQuery)) return true;
      return searchableProjects.some((project) => project.albumId === album.id);
    });
  }, [normalizedSearchQuery, phaseBAlbums, phaseBArtists, searchActive, searchableProjects, selectedLibraryArtistLabel]);

  const visibleSongs = useMemo(() => {
    return searchableProjects.filter((project) => {
      if (selectedLibraryArtistLabel && project.artist !== selectedLibraryArtistLabel) return false;
      if (selectedLibraryAlbumName && project.album !== selectedLibraryAlbumName) return false;
      return true;
    });
  }, [searchableProjects, selectedLibraryAlbumName, selectedLibraryArtistLabel]);

  const loadPhaseBLibrary = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryLoadError("");
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user?.id) {
        setLibraryRecords({ artists: [], albums: [], songs: [] });
        return;
      }

      const [artistsResult, albumsResult, songsResult] = await Promise.all([
        supabase.from("artists").select("id, name").eq("user_id", user.id).order("name", { ascending: true }),
        supabase.from("albums").select("id, artist_id, title").eq("user_id", user.id).order("title", { ascending: true }),
        supabase
          .from("songs")
          .select("id, album_id, title, project_data, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
      ]);

      if (artistsResult.error) throw artistsResult.error;
      if (albumsResult.error) throw albumsResult.error;
      if (songsResult.error) throw songsResult.error;

      setLibraryRecords({
        artists: artistsResult.data || [],
        albums: albumsResult.data || [],
        songs: songsResult.data || [],
      });
    } catch (error) {
      setLibraryLoadError(String(error?.message || "Unable to load your projects."));
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!projectsLibraryOpen) return;
    void loadPhaseBLibrary();
  }, [loadPhaseBLibrary, projectsLibraryOpen]);

  useEffect(() => {
    if (!dialogState || dialogState.type !== "delete" || dialogState.stage !== "countdown") return undefined;
    const timerId = window.setTimeout(() => {
      setDialogState((prev) => {
        if (!prev || prev.type !== "delete" || prev.stage !== "countdown") return prev;
        const nextRemaining = Math.max(0, Number(prev.remaining || 0) - 1);
        if (nextRemaining <= 0) return { ...prev, stage: "armed", remaining: 0 };
        return { ...prev, remaining: nextRemaining };
      });
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [dialogState]);

  function clearProjectsSelection() {
    setSelectedLibraryArtistKey("");
    setSelectedLibraryAlbumName("");
    setSelectedLibrarySongName("");
    setArtist("");
    setAlbumName("");
  }

  function closeDialog() {
    setDialogState(null);
  }

  async function withRefresh(actionKey, action) {
    setBusyActionKey(actionKey);
    try {
      await action();
      await Promise.all([loadPhaseBLibrary(), refreshUserProjects()]);
    } finally {
      setBusyActionKey("");
    }
  }

  function openRenameDialog(config) {
    setDialogState({
      type: "rename",
      title: config.title,
      label: config.label,
      value: config.initialValue,
      confirmLabel: "Save",
      onConfirm: config.onConfirm,
    });
  }

  function openDeleteDialog(config) {
    setDialogState({
      type: "delete",
      title: config.title,
      message: config.message,
      stage: "idle",
      remaining: DELETE_WAIT_SECONDS,
      onDelete: config.onDelete,
    });
  }

  async function submitDialog() {
    if (!dialogState) return;
    if (dialogState.type === "rename") {
      const nextValue = String(dialogState.value || "").trim();
      if (!nextValue) return;
      const run = dialogState.onConfirm;
      closeDialog();
      await run(nextValue);
      return;
    }
    if (dialogState.type === "delete") {
      if (dialogState.stage === "idle") {
        setDialogState((prev) => (prev ? { ...prev, stage: "countdown", remaining: DELETE_WAIT_SECONDS } : prev));
        return;
      }
      if (dialogState.stage === "countdown") return;
      const run = dialogState.onDelete;
      closeDialog();
      await run();
    }
  }

  function handleDialogKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
      return;
    }
    if (e.key === "Enter" && !(dialogState?.type === "delete" && dialogState?.stage === "countdown")) {
      e.preventDefault();
      void submitDialog();
    }
  }

  function renderArtistRow(artistRecord) {
    const artistName = artistRecord.name;
    const active = selectedLibraryArtistLabel === artistName;
    const actionKey = `artist:${artistRecord.id}`;
    const albumIds = phaseBAlbums.filter((album) => album.artistId === artistRecord.id).map((album) => album.id);
    return (
      <div key={artistRecord.id}>
        <div
          style={{
            ...(active ? selectorRowSelectedStyle : selectorRowStyle),
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            background: active ? withAlpha(THEME.accent, 0.04) : withAlpha(THEME.text, 0.012),
            borderColor: active ? withAlpha(THEME.accent, 0.34) : withAlpha(THEME.text, 0.1),
            color: active ? THEME.accent : THEME.text,
            outline: "none",
            transition: "border-color 140ms ease, background 140ms ease, color 140ms ease",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (active) {
                clearProjectsSelection();
                return;
              }
              setSelectedLibraryArtistKey(artistName);
              setSelectedLibraryAlbumName("");
              setSelectedLibrarySongName("");
              setArtist(artistName);
              setAlbumName("");
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              textAlign: "left",
              padding: 0,
              minWidth: 0,
              cursor: "pointer",
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
              {artistName}
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              openRenameDialog({
                title: "Rename artist",
                label: "Artist name",
                initialValue: artistName,
                onConfirm: async (nextValue) => {
                  await withRefresh(actionKey, async () => {
                    const { error } = await supabase.from("artists").update({ name: nextValue }).eq("id", artistRecord.id);
                    if (error) throw error;
                    await renameProjectsArtist(artistName, nextValue);
                    if (selectedLibraryArtistLabel === artistName) {
                      setSelectedLibraryArtistKey(nextValue);
                      setArtist(nextValue);
                    }
                  });
                },
              })
            }
            style={{ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            title={`Edit ${artistName}`}
            aria-label={`Edit ${artistName}`}
          >
            <EditIcon size={12} />
          </button>
          <button
            type="button"
            onClick={() =>
              openDeleteDialog({
                title: "Delete artist?",
                message: `"${artistName}" and all albums/songs will be removed.`,
                onDelete: async () => {
                  await withRefresh(actionKey, async () => {
                    if (albumIds.length > 0) {
                      const { error: songsError } = await supabase.from("songs").delete().in("album_id", albumIds);
                      if (songsError) throw songsError;
                      const { error: albumsError } = await supabase.from("albums").delete().in("id", albumIds);
                      if (albumsError) throw albumsError;
                    }
                    const { error } = await supabase.from("artists").delete().eq("id", artistRecord.id);
                    if (error) throw error;
                    await deleteProjectsByArtist(artistName);
                    if (selectedLibraryArtistLabel === artistName) clearProjectsSelection();
                  });
                },
              })
            }
            style={{ ...actionDeleteBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            aria-label={`Delete ${artistName}`}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  function renderAlbumRow(albumRecord) {
    const albumName = albumRecord.title;
    const active = selectedLibraryAlbumName === albumName;
    const actionKey = `album:${albumRecord.id}`;
    return (
      <div key={albumRecord.id}>
        <div
          style={{
            ...(active ? selectorRowSelectedStyle : selectorRowStyle),
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            background: active ? withAlpha(THEME.accent, 0.04) : withAlpha(THEME.text, 0.012),
            borderColor: active ? withAlpha(THEME.accent, 0.34) : withAlpha(THEME.text, 0.1),
            color: active ? THEME.accent : THEME.text,
            outline: "none",
            transition: "border-color 140ms ease, background 140ms ease, color 140ms ease",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (active) {
                setSelectedLibraryAlbumName("");
                setSelectedLibrarySongName("");
                setAlbumName("");
                return;
              }
              setSelectedLibraryAlbumName(albumName);
              setSelectedLibrarySongName("");
              setAlbumName(albumName);
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              textAlign: "left",
              padding: 0,
              minWidth: 0,
              cursor: "pointer",
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
              {albumName}
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              openRenameDialog({
                title: "Rename album",
                label: "Album name",
                initialValue: albumName,
                onConfirm: async (nextValue) => {
                  await withRefresh(actionKey, async () => {
                    const { error } = await supabase.from("albums").update({ title: nextValue }).eq("id", albumRecord.id);
                    if (error) throw error;
                    await renameProjectsAlbum({
                      artist: selectedLibraryArtistLabel,
                      currentAlbum: albumName,
                      nextAlbum: nextValue,
                    });
                    if (selectedLibraryAlbumName === albumName) {
                      setSelectedLibraryAlbumName(nextValue);
                      setAlbumName(nextValue);
                    }
                  });
                },
              })
            }
            style={{ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            title={`Edit ${albumName}`}
            aria-label={`Edit ${albumName}`}
          >
            <EditIcon size={12} />
          </button>
          <button
            type="button"
            onClick={() =>
              openDeleteDialog({
                title: "Delete album?",
                message: `"${albumName}" and all songs in it will be removed.`,
                onDelete: async () => {
                  await withRefresh(actionKey, async () => {
                    const { error: songsError } = await supabase.from("songs").delete().eq("album_id", albumRecord.id);
                    if (songsError) throw songsError;
                    const { error } = await supabase.from("albums").delete().eq("id", albumRecord.id);
                    if (error) throw error;
                    await deleteProjectsByAlbum({ artist: selectedLibraryArtistLabel, album: albumName });
                    if (selectedLibraryAlbumName === albumName) {
                      setSelectedLibraryAlbumName("");
                      setSelectedLibrarySongName("");
                      setAlbumName("");
                    }
                  });
                },
              })
            }
            style={{ ...actionDeleteBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            aria-label={`Delete ${albumName}`}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  function renderSongRow(project) {
    const activeProjectId = project.legacyProjectId || project.id;
    const active = String(currentProjectId || "") === String(activeProjectId || "");
    const openBusy = String(projectActionBusyId || "") === String(project.id || "");
    const editBusy = busyActionKey === `song:${project.id}`;
    const selected = selectedLibrarySongName === project.title;
    return (
      <div key={project.id || `${project.artist}__${project.album}__${project.title}`}>
        <div
          style={{
            ...(active || selected ? selectorRowSelectedStyle : selectorRowStyle),
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            borderColor: active || selected ? withAlpha(THEME.accent, 0.34) : withAlpha(THEME.text, 0.1),
            background: active || selected ? withAlpha(THEME.accent, 0.04) : withAlpha(THEME.text, 0.012),
            color: active || selected ? THEME.accent : THEME.text,
            outline: "none",
            transition: "border-color 140ms ease, background 140ms ease, color 140ms ease",
          }}
        >
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.title || "Untitled Project"}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedLibrarySongName(project.title || "");
              void openSupabaseProject(project);
            }}
            disabled={openBusy}
            style={{ ...btnSecondary, height: 28, padding: "0 9px", fontSize: 11, borderRadius: 8 }}
          >
            {openBusy ? "Opening..." : "Open"}
          </button>
          <button
            type="button"
            onClick={() =>
              openRenameDialog({
                title: "Rename song",
                label: "Song name",
                initialValue: project.title || "",
                onConfirm: async (nextValue) => {
                  await withRefresh(`song:${project.id}`, async () => {
                    const { error } = await supabase.from("songs").update({ title: nextValue }).eq("id", project.id);
                    if (error) throw error;
                    if (project.legacyProjectId) {
                      await updateProject(project.legacyProjectId, {
                        title: nextValue,
                        artist: project.artist,
                        album: project.album,
                        projectData: project.project_data || {},
                      });
                    }
                    if (selectedLibrarySongName === project.title) setSelectedLibrarySongName(nextValue);
                  });
                },
              })
            }
            disabled={editBusy}
            style={{ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            title={`Edit ${project.title || "song"}`}
            aria-label={`Edit ${project.title || "song"}`}
          >
            <EditIcon size={12} />
          </button>
          <button
            type="button"
            onClick={() =>
              openDeleteDialog({
                title: "Delete song?",
                message: `"${project.title || "This song"}" will be removed. This action cannot be undone.`,
                onDelete: async () => {
                  await withRefresh(`song:${project.id}`, async () => {
                    const { error } = await supabase.from("songs").delete().eq("id", project.id);
                    if (error) throw error;
                    if (project.legacyProjectId) {
                      await deleteProject(project.legacyProjectId);
                    }
                    if (selectedLibrarySongName === project.title) setSelectedLibrarySongName("");
                  });
                },
              })
            }
            disabled={editBusy}
            style={{ ...actionDeleteBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            aria-label={`Delete ${project.title || "song"}`}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  if (!projectsLibraryOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: THEME.bg,
        zIndex: 5000,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: THEME.surfaceWarm,
          border: "none",
          boxShadow: "none",
          padding: `${PROJECTS_HEADER_CLEARANCE + PROJECTS_SECTION_GAP}px 18px 18px`,
          boxSizing: "border-box",
          display: "grid",
          gridTemplateRows: `${searchControlHeight}px minmax(0, 1fr)`,
          gap: PROJECTS_SECTION_GAP,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: THEME.textFaint,
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists, albums, or songs..."
              aria-label="Search artists, albums, or songs"
              style={{ ...field, fontWeight: 800, paddingLeft: 36 }}
            />
          </div>
          <button
            type="button"
            onClick={() => setProjectsLibraryOpen(false)}
            style={{ ...microButton, height: searchControlHeight, minHeight: searchControlHeight, flexShrink: 0 }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
            gap: 10,
            minHeight: 0,
            alignItems: "start",
          }}
        >
          <div style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Artists</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {libraryLoading ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Loading artists...</div>
              ) : visibleArtists.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {libraryLoadError ? libraryLoadError : searchActive ? "No matching artists." : "No saved artists yet."}
                </div>
              ) : (
                visibleArtists.map((artistRecord) => renderArtistRow(artistRecord))
              )}
            </div>
          </div>

          <div style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Albums</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {libraryLoading ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Loading albums...</div>
              ) : !selectedLibraryArtistLabel ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Select an artist to browse albums.</div>
              ) : visibleAlbums.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {searchActive ? "No matching albums." : "No albums found for this artist yet."}
                </div>
              ) : (
                visibleAlbums.map((albumRecord) => renderAlbumRow(albumRecord))
              )}
            </div>
          </div>

          <div style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Songs</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {libraryLoading ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Loading songs...</div>
              ) : visibleSongs.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {searchActive ? "No matching songs." : "Select an artist or album to browse songs."}
                </div>
              ) : (
                visibleSongs.map((project) => renderSongRow(project))
              )}
            </div>
          </div>
        </div>
      </div>

      {dialogState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 5100,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div
            style={{
              width: "min(460px, calc(100vw - 32px))",
              borderRadius: 22,
              border: `1px solid ${THEME.border}`,
              background: THEME.surface,
              color: THEME.text,
              boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
              padding: 18,
              boxSizing: "border-box",
              display: "grid",
              gap: 12,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={handleDialogKeyDown}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 950, color: THEME.text }}>{dialogState.title}</div>
              <button type="button" onClick={closeDialog} style={{ ...microButton }}>
                Close
              </button>
            </div>

            {dialogState.type === "rename" ? (
              <>
                <label style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>{dialogState.label}</label>
                <input
                  autoFocus
                  value={dialogState.value}
                  onChange={(e) => setDialogState((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                  style={{ ...field, fontWeight: 800 }}
                />
              </>
            ) : (
              <div style={{ fontSize: 14, color: THEME.textFaint, lineHeight: 1.5 }}>
                {dialogState.message}
                {dialogState.stage === "countdown" ? ` Delete unlocks in ${dialogState.remaining}s. You can still cancel.` : ""}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={closeDialog} style={{ ...btnSecondary, height: 36, padding: "0 12px" }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void submitDialog();
                }}
                disabled={dialogState.type === "delete" && dialogState.stage === "countdown"}
                style={{
                  ...btnSecondary,
                  height: 36,
                  padding: "0 12px",
                  borderColor:
                    dialogState.type === "delete" ? withAlpha(THEME.danger, 0.28) : withAlpha(THEME.accent, 0.28),
                  color: dialogState.type === "delete" ? THEME.danger : THEME.text,
                  background:
                    dialogState.type === "delete"
                      ? withAlpha(THEME.danger, 0.08)
                      : withAlpha(THEME.accent, 0.08),
                  cursor: dialogState.type === "delete" && dialogState.stage === "countdown" ? "default" : "pointer",
                }}
              >
                {dialogState.type === "rename"
                  ? dialogState.confirmLabel
                  : dialogState.stage === "idle"
                  ? "Delete"
                  : dialogState.stage === "countdown"
                  ? `Delete (${dialogState.remaining})`
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
