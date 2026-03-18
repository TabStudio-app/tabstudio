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

function matchesSearchValue(value, query) {
  if (!query) return true;
  return String(value || "").trim().toLowerCase().includes(query);
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
  const [unassignedAlbumsOpen, setUnassignedAlbumsOpen] = useState(false);
  const [unassignedSongsOpen, setUnassignedSongsOpen] = useState(false);
  const [hoveredRowKey, setHoveredRowKey] = useState("");
  const [dragState, setDragState] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState("");
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

  const legacyProjects = useMemo(
    () =>
      (Array.isArray(userProjects) ? userProjects : []).map((project) => ({
        id: String(project?.id || ""),
        title: String(project?.title || "").trim(),
        artist: String(project?.artist || "").trim(),
        album: String(project?.album || "").trim(),
        project_data:
          project?.project_data && typeof project.project_data === "object"
            ? project.project_data
            : {},
      })),
    [userProjects]
  );

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

  const visibleArtists = useMemo(
    () => phaseBArtists.filter((artist) => matchesSearchValue(artist.name, normalizedSearchQuery)),
    [normalizedSearchQuery, phaseBArtists]
  );

  const unassignedAlbums = useMemo(
    () =>
      phaseBAlbums.filter((album) => !album.artistId && matchesSearchValue(album.title, normalizedSearchQuery)),
    [normalizedSearchQuery, phaseBAlbums]
  );

  const visibleAlbums = useMemo(() => {
    const selectedArtist = phaseBArtists.find((artist) => artist.name === selectedLibraryArtistLabel) || null;
    return phaseBAlbums.filter((album) => {
      if (!album.artistId) return false;
      if (selectedArtist && album.artistId !== selectedArtist.id) return false;
      if (!selectedArtist && !searchActive) return false;
      return matchesSearchValue(album.title, normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, phaseBAlbums, phaseBArtists, searchActive, selectedLibraryArtistLabel]);

  const unassignedSongs = useMemo(
    () =>
      savedProjects.filter((project) => !project.albumId && matchesSearchValue(project.title, normalizedSearchQuery)),
    [normalizedSearchQuery, savedProjects]
  );

  const visibleSongs = useMemo(() => {
    return savedProjects.filter((project) => {
      if (!project.albumId) return false;
      if (!matchesSearchValue(project.title, normalizedSearchQuery)) return false;
      if (selectedLibraryArtistLabel && project.artist !== selectedLibraryArtistLabel) return false;
      if (selectedLibraryAlbumName && project.album !== selectedLibraryAlbumName) return false;
      if (!selectedLibraryArtistLabel && !selectedLibraryAlbumName && !searchActive) return false;
      return true;
    });
  }, [normalizedSearchQuery, savedProjects, searchActive, selectedLibraryAlbumName, selectedLibraryArtistLabel]);

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

  async function requireCurrentUserId() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user?.id) throw new Error("You must be signed in to manage projects.");
    return user.id;
  }

  function buildLegacyPayload(project, overrides = {}) {
    return {
      title: Object.prototype.hasOwnProperty.call(overrides, "title") ? overrides.title : project.title,
      artist: Object.prototype.hasOwnProperty.call(overrides, "artist") ? overrides.artist : project.artist,
      album: Object.prototype.hasOwnProperty.call(overrides, "album") ? overrides.album : project.album,
      projectData: Object.prototype.hasOwnProperty.call(overrides, "projectData") ? overrides.projectData : project.project_data || {},
    };
  }

  async function syncLegacyAlbumProjects({ currentArtist = "", currentAlbum = "", nextArtist = "", nextAlbum = "" }) {
    const matchingProjects = legacyProjects.filter(
      (project) => project.artist === String(currentArtist || "").trim() && project.album === String(currentAlbum || "").trim()
    );
    await Promise.all(
      matchingProjects.map((project) =>
        updateProject(
          project.id,
          buildLegacyPayload(project, {
            artist: String(nextArtist || "").trim(),
            album: String(nextAlbum || "").trim(),
          })
        )
      )
    );
  }

  async function unassignLegacyProjectsByArtist(artistName) {
    const matchingProjects = legacyProjects.filter((project) => project.artist === String(artistName || "").trim());
    await Promise.all(
      matchingProjects.map((project) =>
        updateProject(
          project.id,
          buildLegacyPayload(project, {
            artist: "",
          })
        )
      )
    );
  }

  async function unassignLegacyProjectsByAlbum({ artist = "", album = "" }) {
    const matchingProjects = legacyProjects.filter(
      (project) =>
        project.artist === String(artist || "").trim() &&
        project.album === String(album || "").trim()
    );
    await Promise.all(
      matchingProjects.map((project) =>
        updateProject(
          project.id,
          buildLegacyPayload(project, {
            artist: "",
            album: "",
          })
        )
      )
    );
  }

  async function syncLegacySongProject(project, { title, albumId }) {
    if (!project?.legacyProjectId) return;
    const legacyProject = legacyProjects.find((entry) => entry.id === project.legacyProjectId);
    if (!legacyProject) return;
    const targetAlbum = phaseBAlbums.find((entry) => entry.id === String(albumId || "")) || null;
    const targetArtist = targetAlbum?.artistId ? artistNameById.get(targetAlbum.artistId) || "" : "";
    await updateProject(
      legacyProject.id,
      buildLegacyPayload(legacyProject, {
        title: String(title || "").trim(),
        artist: targetArtist,
        album: String(targetAlbum?.title || "").trim(),
      })
    );
  }

  function openCreateArtistDialog() {
    openRenameDialog({
      title: "Add artist",
      label: "Artist name",
      initialValue: "",
      confirmLabel: "Create",
      onConfirm: async (form) => {
        const name = String(form?.value || "").trim();
        if (!name) return;
        await withRefresh("create:artist", async () => {
          const userId = await requireCurrentUserId();
          const { error } = await supabase.from("artists").insert({ user_id: userId, name });
          if (error) throw error;
        });
      },
    });
  }

  function openCreateAlbumDialog() {
    const selectedArtist = phaseBArtists.find((artist) => artist.name === selectedLibraryArtistLabel) || null;
    openRenameDialog({
      title: "Add album",
      label: "Album name",
      initialValue: "",
      confirmLabel: "Create",
      assignmentArtistId: selectedArtist?.id || "",
      onConfirm: async (form) => {
        const title = String(form?.value || "").trim();
        if (!title) return;
        await withRefresh("create:album", async () => {
          const userId = await requireCurrentUserId();
          const { error } = await supabase.from("albums").insert({
            user_id: userId,
            title,
            artist_id: String(form?.assignmentArtistId || "").trim() || null,
          });
          if (error) throw error;
        });
      },
    });
  }

  function openCreateSongDialog() {
    const selectedAlbum = phaseBAlbums.find(
      (album) =>
        album.title === selectedLibraryAlbumName &&
        (album.artistId ? artistNameById.get(album.artistId) || "" : "") === String(selectedLibraryArtistLabel || "")
    );
    openRenameDialog({
      title: "Add song",
      label: "Song name",
      initialValue: "",
      confirmLabel: "Create",
      assignmentAlbumId: selectedAlbum?.id || "",
      onConfirm: async (form) => {
        const title = String(form?.value || "").trim();
        if (!title) return;
        await withRefresh("create:song", async () => {
          const userId = await requireCurrentUserId();
          const { error } = await supabase.from("songs").insert({
            user_id: userId,
            title,
            album_id: String(form?.assignmentAlbumId || "").trim() || null,
            project_data: {},
          });
          if (error) throw error;
        });
      },
    });
  }

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
      ...config,
      type: "rename",
      title: config.title,
      label: config.label,
      value: config.initialValue,
      confirmLabel: config.confirmLabel || "Save",
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
      await run({
        value: nextValue,
        assignmentArtistId: String(dialogState.assignmentArtistId || ""),
        assignmentAlbumId: String(dialogState.assignmentAlbumId || ""),
      });
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

  function renderFolderRow({ label, itemCount, open, onToggle, children }) {
    return (
      <div>
        <button
          type="button"
          onClick={onToggle}
          style={{
            ...selectorRowStyle,
            width: "100%",
            justifyContent: "space-between",
            display: "flex",
            alignItems: "center",
            background: withAlpha(THEME.text, 0.01),
            borderColor: withAlpha(THEME.text, 0.12),
            color: THEME.text,
          }}
        >
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {open ? "▼" : "▶"} {label}
          </span>
          <span style={{ fontSize: 11, color: THEME.textFaint }}>{itemCount}</span>
        </button>
        {open && <div style={{ display: "grid", gap: 6, paddingTop: 6, paddingLeft: 10 }}>{children}</div>}
      </div>
    );
  }

  function getActionButtonStyle(baseStyle, visible) {
    return {
      ...baseStyle,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transform: visible ? "translateX(0)" : "translateX(4px)",
      transition: "opacity 140ms ease, transform 140ms ease",
    };
  }

  function startDrag(payload) {
    return (e) => {
      setDragState(payload);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    };
  }

  function clearDragState() {
    setDragState(null);
    setDropTargetKey("");
  }

  function allowDrop(expectedType, key) {
    return (e) => {
      if (dragState?.type !== expectedType) return;
      e.preventDefault();
      if (dropTargetKey !== key) setDropTargetKey(key);
      e.dataTransfer.dropEffect = "move";
    };
  }

  function leaveDropTarget(key) {
    return () => {
      if (dropTargetKey === key) setDropTargetKey("");
    };
  }

  async function applyAlbumArtistReassignment(albumId, targetArtist) {
    const sourceAlbum = phaseBAlbums.find((album) => album.id === String(albumId || ""));
    if (!sourceAlbum || !targetArtist?.id || sourceAlbum.artistId === targetArtist.id) return;
    const currentArtistName = sourceAlbum.artistId ? artistNameById.get(sourceAlbum.artistId) || "" : "";
    const { error } = await supabase.from("albums").update({ artist_id: targetArtist.id }).eq("id", sourceAlbum.id);
    if (error) throw error;
    await syncLegacyAlbumProjects({
      currentArtist: currentArtistName,
      currentAlbum: sourceAlbum.title,
      nextArtist: targetArtist.name,
      nextAlbum: sourceAlbum.title,
    });
    if (selectedLibraryAlbumName === sourceAlbum.title) {
      setSelectedLibraryArtistKey(targetArtist.name);
      setArtist(targetArtist.name);
    }
  }

  async function moveAlbumToArtist(albumId, targetArtist) {
    const sourceAlbum = phaseBAlbums.find((album) => album.id === String(albumId || ""));
    if (!sourceAlbum || !targetArtist?.id || sourceAlbum.artistId === targetArtist.id) return;
    await withRefresh(`move:album:${sourceAlbum.id}`, async () => {
      await applyAlbumArtistReassignment(albumId, targetArtist);
    });
  }

  async function saveAlbumEdits(albumRecord, { title, artistId }) {
    const nextTitle = String(title || "").trim();
    const nextArtistId = String(artistId || "").trim();
    const currentArtistName = albumRecord.artistId ? artistNameById.get(albumRecord.artistId) || "" : "";
    const nextArtistName = nextArtistId ? artistNameById.get(nextArtistId) || "" : "";
    if (!nextTitle) return;

    await withRefresh(`album:${albumRecord.id}`, async () => {
      if ((albumRecord.artistId || "") !== nextArtistId && nextArtistId) {
        await applyAlbumArtistReassignment(albumRecord.id, { id: nextArtistId, name: nextArtistName });
      } else if ((albumRecord.artistId || "") !== nextArtistId) {
        const { error } = await supabase.from("albums").update({ artist_id: null }).eq("id", albumRecord.id);
        if (error) throw error;
        await syncLegacyAlbumProjects({
          currentArtist: currentArtistName,
          currentAlbum: albumRecord.title,
          nextArtist: "",
          nextAlbum: albumRecord.title,
        });
      }

      if (albumRecord.title !== nextTitle) {
        const { error } = await supabase.from("albums").update({ title: nextTitle }).eq("id", albumRecord.id);
        if (error) throw error;
        if ((albumRecord.artistId || "") === nextArtistId) {
          await renameProjectsAlbum({
            artist: currentArtistName,
            currentAlbum: albumRecord.title,
            nextAlbum: nextTitle,
          });
        } else {
          await syncLegacyAlbumProjects({
            currentArtist: nextArtistName,
            currentAlbum: albumRecord.title,
            nextArtist: nextArtistName,
            nextAlbum: nextTitle,
          });
        }
      }

      if (selectedLibraryAlbumName === albumRecord.title) {
        setSelectedLibraryArtistKey(nextArtistName);
        setArtist(nextArtistName);
        setSelectedLibraryAlbumName(nextTitle);
        setAlbumName(nextTitle);
      }
    });
  }

  async function applySongAlbumReassignment(songId, targetAlbum) {
    const sourceSong = savedProjects.find((project) => project.id === String(songId || ""));
    if (!sourceSong || !targetAlbum?.id || sourceSong.albumId === targetAlbum.id) return;
    const targetArtistName = targetAlbum.artistId ? artistNameById.get(targetAlbum.artistId) || "" : "";
    const { error } = await supabase.from("songs").update({ album_id: targetAlbum.id }).eq("id", sourceSong.id);
    if (error) throw error;
    await syncLegacySongProject(sourceSong, { title: sourceSong.title, albumId: targetAlbum.id });
    if (selectedLibrarySongName === sourceSong.title) {
      setSelectedLibraryArtistKey(targetArtistName);
      setArtist(targetArtistName);
      setSelectedLibraryAlbumName(targetAlbum.title);
      setAlbumName(targetAlbum.title);
    }
  }

  async function moveSongToAlbum(songId, targetAlbum) {
    const sourceSong = savedProjects.find((project) => project.id === String(songId || ""));
    if (!sourceSong || !targetAlbum?.id || sourceSong.albumId === targetAlbum.id) return;
    await withRefresh(`move:song:${sourceSong.id}`, async () => {
      await applySongAlbumReassignment(songId, targetAlbum);
    });
  }

  async function saveSongEdits(project, { title, albumId }) {
    const nextTitle = String(title || "").trim();
    const nextAlbumId = String(albumId || "").trim();
    const targetAlbum = phaseBAlbums.find((album) => album.id === nextAlbumId) || null;
    const targetArtistName = targetAlbum?.artistId ? artistNameById.get(targetAlbum.artistId) || "" : "";
    if (!nextTitle) return;

    await withRefresh(`song:${project.id}`, async () => {
      if ((project.albumId || "") !== nextAlbumId && targetAlbum) {
        await applySongAlbumReassignment(project.id, targetAlbum);
      } else if ((project.albumId || "") !== nextAlbumId) {
        const { error } = await supabase.from("songs").update({ album_id: null }).eq("id", project.id);
        if (error) throw error;
        await syncLegacySongProject(project, { title: project.title, albumId: "" });
        if (selectedLibrarySongName === project.title) {
          setSelectedLibraryArtistKey("");
          setArtist("");
          setSelectedLibraryAlbumName("");
          setAlbumName("");
        }
      }

      if (project.title !== nextTitle) {
        const { error } = await supabase.from("songs").update({ title: nextTitle }).eq("id", project.id);
        if (error) throw error;
        await syncLegacySongProject(project, { title: nextTitle, albumId: nextAlbumId });
      }

      if (selectedLibrarySongName === project.title) {
        setSelectedLibrarySongName(nextTitle);
        setSelectedLibraryArtistKey(targetArtistName);
        setArtist(targetArtistName);
        setSelectedLibraryAlbumName(String(targetAlbum?.title || ""));
        setAlbumName(String(targetAlbum?.title || ""));
      }
    });
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
    const rowKey = `artist-row:${artistRecord.id}`;
    const actionsVisible = hoveredRowKey === rowKey || active;
    const albumIds = phaseBAlbums.filter((album) => album.artistId === artistRecord.id).map((album) => album.id);
    const isDropTarget = dropTargetKey === `artist:${artistRecord.id}`;
    return (
      <div
        key={artistRecord.id}
        onPointerEnter={() => setHoveredRowKey(rowKey)}
        onPointerLeave={() => setHoveredRowKey((prev) => (prev === rowKey ? "" : prev))}
        onFocusCapture={() => setHoveredRowKey(rowKey)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setHoveredRowKey((prev) => (prev === rowKey ? "" : prev));
          }
        }}
        onDragOver={allowDrop("album", `artist:${artistRecord.id}`)}
        onDragLeave={leaveDropTarget(`artist:${artistRecord.id}`)}
        onDrop={(e) => {
          if (dragState?.type !== "album") return;
          e.preventDefault();
          setDropTargetKey("");
          void moveAlbumToArtist(dragState.id, artistRecord);
          clearDragState();
        }}
      >
        <div
          style={{
            ...(active ? selectorRowSelectedStyle : selectorRowStyle),
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            background: isDropTarget
              ? withAlpha(THEME.accent, 0.08)
              : active
              ? withAlpha(THEME.accent, 0.04)
              : withAlpha(THEME.text, 0.012),
            borderColor: isDropTarget
              ? withAlpha(THEME.accent, 0.44)
              : active
              ? withAlpha(THEME.accent, 0.34)
              : withAlpha(THEME.text, 0.1),
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
                onConfirm: async (form) => {
                  const nextValue = String(form?.value || "").trim();
                  if (!nextValue) return;
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
            style={getActionButtonStyle({ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }, actionsVisible)}
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
                message: `"${artistName}" will be removed. Albums will become unassigned.`,
                onDelete: async () => {
                  await withRefresh(actionKey, async () => {
                    if (albumIds.length > 0) {
                      const { error: albumsError } = await supabase.from("albums").update({ artist_id: null }).in("id", albumIds);
                      if (albumsError) throw albumsError;
                    }
                    const { error } = await supabase.from("artists").delete().eq("id", artistRecord.id);
                    if (error) throw error;
                    await unassignLegacyProjectsByArtist(artistName);
                    if (selectedLibraryArtistLabel === artistName) clearProjectsSelection();
                  });
                },
              })
            }
            style={getActionButtonStyle({ ...actionDeleteBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }, actionsVisible)}
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
    const albumArtistName = artistNameById.get(albumRecord.artistId) || "";
    const active = selectedLibraryAlbumName === albumName;
    const actionKey = `album:${albumRecord.id}`;
    const rowKey = `album-row:${albumRecord.id}`;
    const actionsVisible = hoveredRowKey === rowKey || active;
    const isSongDropTarget = dropTargetKey === `album-song:${albumRecord.id}`;
    return (
      <div
        key={albumRecord.id}
        draggable
        onPointerEnter={() => setHoveredRowKey(rowKey)}
        onPointerLeave={() => setHoveredRowKey((prev) => (prev === rowKey ? "" : prev))}
        onFocusCapture={() => setHoveredRowKey(rowKey)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setHoveredRowKey((prev) => (prev === rowKey ? "" : prev));
          }
        }}
        onDragStart={startDrag({ type: "album", id: albumRecord.id })}
        onDragEnd={clearDragState}
        onDragOver={allowDrop("song", `album-song:${albumRecord.id}`)}
        onDragLeave={leaveDropTarget(`album-song:${albumRecord.id}`)}
        onDrop={(e) => {
          if (dragState?.type !== "song") return;
          e.preventDefault();
          setDropTargetKey("");
          void moveSongToAlbum(dragState.id, albumRecord);
          clearDragState();
        }}
      >
        <div
          style={{
            ...(active ? selectorRowSelectedStyle : selectorRowStyle),
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            background: isSongDropTarget
              ? withAlpha(THEME.accent, 0.08)
              : active
              ? withAlpha(THEME.accent, 0.04)
              : withAlpha(THEME.text, 0.012),
            borderColor: isSongDropTarget
              ? withAlpha(THEME.accent, 0.44)
              : active
              ? withAlpha(THEME.accent, 0.34)
              : withAlpha(THEME.text, 0.1),
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
              setSelectedLibraryArtistKey(albumArtistName);
              setArtist(albumArtistName);
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
                assignmentArtistId: albumRecord.artistId || "",
                onConfirm: async (form) => {
                  const nextValue = String(form?.value || "").trim();
                  if (!nextValue) return;
                  await saveAlbumEdits(albumRecord, {
                    title: nextValue,
                    artistId: String(form?.assignmentArtistId || ""),
                  });
                },
              })
            }
            style={getActionButtonStyle({ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }, actionsVisible)}
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
                message: `"${albumName}" will be removed. Songs will become unassigned.`,
                onDelete: async () => {
                  await withRefresh(actionKey, async () => {
                    const { error: songsError } = await supabase.from("songs").update({ album_id: null }).eq("album_id", albumRecord.id);
                    if (songsError) throw songsError;
                    const { error } = await supabase.from("albums").delete().eq("id", albumRecord.id);
                    if (error) throw error;
                    await unassignLegacyProjectsByAlbum({ artist: selectedLibraryArtistLabel, album: albumName });
                    if (selectedLibraryAlbumName === albumName) {
                      setSelectedLibraryAlbumName("");
                      setSelectedLibrarySongName("");
                      setAlbumName("");
                    }
                  });
                },
              })
            }
            style={getActionButtonStyle({ ...actionDeleteBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }, actionsVisible)}
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
    const rowKey = `song-row:${project.id}`;
    const actionsVisible = hoveredRowKey === rowKey || active || selected;
    return (
      <div
        key={project.id || `${project.artist}__${project.album}__${project.title}`}
        draggable
        onPointerEnter={() => setHoveredRowKey(rowKey)}
        onPointerLeave={() => setHoveredRowKey((prev) => (prev === rowKey ? "" : prev))}
        onFocusCapture={() => setHoveredRowKey(rowKey)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setHoveredRowKey((prev) => (prev === rowKey ? "" : prev));
          }
        }}
        onDragStart={startDrag({ type: "song", id: project.id })}
        onDragEnd={clearDragState}
      >
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
            style={getActionButtonStyle({ ...btnSecondary, height: 28, padding: "0 9px", fontSize: 11, borderRadius: 8 }, actionsVisible)}
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
                assignmentAlbumId: project.albumId || "",
                onConfirm: async (form) => {
                  const nextValue = String(form?.value || "").trim();
                  if (!nextValue) return;
                  await saveSongEdits(project, {
                    title: nextValue,
                    albumId: String(form?.assignmentAlbumId || ""),
                  });
                },
              })
            }
            disabled={editBusy}
            style={getActionButtonStyle({ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }, actionsVisible)}
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
            style={getActionButtonStyle({ ...actionDeleteBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }, actionsVisible)}
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
              <button
                type="button"
                onClick={openCreateArtistDialog}
                style={{ ...microButton, width: 28, minWidth: 28, height: 28, padding: 0, borderRadius: 8 }}
                aria-label="Add artist"
                title="Add artist"
              >
                +
              </button>
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
              <button
                type="button"
                onClick={openCreateAlbumDialog}
                style={{ ...microButton, width: 28, minWidth: 28, height: 28, padding: 0, borderRadius: 8 }}
                aria-label="Add album"
                title="Add album"
              >
                +
              </button>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {libraryLoading ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Loading albums...</div>
              ) : visibleAlbums.length === 0 && unassignedAlbums.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {!selectedLibraryArtistLabel && !searchActive
                    ? "Select an artist to browse albums."
                    : searchActive
                    ? "No matching albums."
                    : "No albums found for this artist yet."}
                </div>
              ) : (
                <>
                  {visibleAlbums.map((albumRecord) => renderAlbumRow(albumRecord))}
                  {unassignedAlbums.length > 0 &&
                    renderFolderRow({
                      label: "Unassigned Albums",
                      itemCount: unassignedAlbums.length,
                      open: unassignedAlbumsOpen,
                      onToggle: () => setUnassignedAlbumsOpen((prev) => !prev),
                      children: unassignedAlbums.map((albumRecord) => renderAlbumRow(albumRecord)),
                    })}
                </>
              )}
            </div>
          </div>

          <div style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Songs</div>
              <button
                type="button"
                onClick={openCreateSongDialog}
                style={{ ...microButton, width: 28, minWidth: 28, height: 28, padding: 0, borderRadius: 8 }}
                aria-label="Add song"
                title="Add song"
              >
                +
              </button>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {libraryLoading ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Loading songs...</div>
              ) : visibleSongs.length === 0 && unassignedSongs.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {searchActive ? "No matching songs." : "Select an artist or album to browse songs."}
                </div>
              ) : (
                <>
                  {visibleSongs.map((project) => renderSongRow(project))}
                  {unassignedSongs.length > 0 &&
                    renderFolderRow({
                      label: "Unassigned Songs",
                      itemCount: unassignedSongs.length,
                      open: unassignedSongsOpen,
                      onToggle: () => setUnassignedSongsOpen((prev) => !prev),
                      children: unassignedSongs.map((project) => renderSongRow(project)),
                    })}
                </>
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
                {Object.prototype.hasOwnProperty.call(dialogState, "assignmentArtistId") && (
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>Artist assignment</span>
                    <select
                      value={String(dialogState.assignmentArtistId || "")}
                      onChange={(e) =>
                        setDialogState((prev) =>
                          prev
                            ? {
                                ...prev,
                                assignmentArtistId: e.target.value,
                              }
                            : prev
                        )
                      }
                      style={{ ...field, fontWeight: 800 }}
                    >
                      <option value="">Unassigned Albums</option>
                      {phaseBArtists.map((artist) => (
                        <option key={artist.id} value={artist.id}>
                          {artist.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {Object.prototype.hasOwnProperty.call(dialogState, "assignmentAlbumId") && (
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>Album assignment</span>
                    <select
                      value={String(dialogState.assignmentAlbumId || "")}
                      onChange={(e) =>
                        setDialogState((prev) =>
                          prev
                            ? {
                                ...prev,
                                assignmentAlbumId: e.target.value,
                              }
                            : prev
                        )
                      }
                      style={{ ...field, fontWeight: 800 }}
                    >
                      <option value="">Unassigned Songs</option>
                      {phaseBAlbums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {album.artistId ? `${artistNameById.get(album.artistId) || "Artist"} / ${album.title}` : album.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
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
