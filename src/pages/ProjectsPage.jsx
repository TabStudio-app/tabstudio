import React, { useEffect, useMemo, useState } from "react";
import {
  deleteProject,
  deleteProjectsByAlbum,
  deleteProjectsByArtist,
  renameProjectsAlbum,
  renameProjectsArtist,
  updateProject,
} from "../lib/projects";
import { buttonMicro, cardDense, menuItem, menuItemSelected } from "../utils/uiTokens";

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
    projectsLoading,
    projectsLoadError,
    projectActionBusyId,
    refreshUserProjects,
    openSupabaseProject,
    THEME,
    withAlpha,
  } = shared;

  const [searchQuery, setSearchQuery] = useState("");
  const [busyActionKey, setBusyActionKey] = useState("");
  const [dialogState, setDialogState] = useState(null);

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

  const savedProjects = useMemo(
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

  const searchableProjects = useMemo(
    () =>
      savedProjects.filter((project) =>
        !searchActive ? true : [project.artist, project.album, project.title].join(" ").toLowerCase().includes(normalizedSearchQuery)
      ),
    [normalizedSearchQuery, savedProjects, searchActive]
  );

  const visibleArtists = useMemo(
    () => [...new Set(searchableProjects.map((project) => project.artist).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [searchableProjects]
  );

  const visibleAlbums = useMemo(() => {
    if (!selectedLibraryArtistLabel) return [];
    const projectsForArtist = searchableProjects.filter((project) => project.artist === selectedLibraryArtistLabel);
    return [...new Set(projectsForArtist.map((project) => project.album).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [searchableProjects, selectedLibraryArtistLabel]);

  const visibleSongs = useMemo(() => {
    return searchableProjects.filter((project) => {
      if (selectedLibraryArtistLabel && project.artist !== selectedLibraryArtistLabel) return false;
      if (selectedLibraryAlbumName && project.album !== selectedLibraryAlbumName) return false;
      return true;
    });
  }, [searchableProjects, selectedLibraryAlbumName, selectedLibraryArtistLabel]);

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
      await refreshUserProjects();
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

  function renderArtistRow(artistName) {
    const active = selectedLibraryArtistLabel === artistName;
    const actionKey = `artist:${artistName}`;
    return (
      <div key={artistName}>
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

  function renderAlbumRow(albumName) {
    const active = selectedLibraryAlbumName === albumName;
    const actionKey = `album:${selectedLibraryArtistLabel}:${albumName}`;
    return (
      <div key={`${selectedLibraryArtistLabel}__${albumName}`}>
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
    const active = String(currentProjectId || "") === String(project.id || "");
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
              void openSupabaseProject(project.id);
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
                    await updateProject(project.id, {
                      title: nextValue,
                      artist: project.artist,
                      album: project.album,
                      projectData: project.project_data || {},
                    });
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
                    await deleteProject(project.id);
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
              {projectsLoading ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Loading artists...</div>
              ) : visibleArtists.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {projectsLoadError ? projectsLoadError : searchActive ? "No matching artists." : "No saved artists yet."}
                </div>
              ) : (
                visibleArtists.map((artistName) => renderArtistRow(artistName))
              )}
            </div>
          </div>

          <div style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Albums</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {projectsLoading ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Loading albums...</div>
              ) : !selectedLibraryArtistLabel ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>Select an artist to browse albums.</div>
              ) : visibleAlbums.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {searchActive ? "No matching albums." : "No albums found for this artist yet."}
                </div>
              ) : (
                visibleAlbums.map((albumName) => renderAlbumRow(albumName))
              )}
            </div>
          </div>

          <div style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Songs</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {projectsLoading ? (
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
