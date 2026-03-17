import React, { useMemo, useState } from "react";
import { buttonMicro, buttonSecondary, cardDense, menuItem, menuItemSelected } from "../utils/uiTokens";

export default function ProjectsPage({ shared }) {
  const PROJECTS_HEADER_CLEARANCE = 66;
  const PROJECTS_SECTION_GAP = 12;
  const {
    btnSecondary,
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
    currentProjectId,
    userProjects,
    projectsLoading,
    projectsLoadError,
    projectActionBusyId,
    openSupabaseProject,
    THEME,
    withAlpha,
  } = shared;

  if (!projectsLibraryOpen) return null;

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
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchActive = normalizedSearchQuery.length > 0;

  const savedProjects = useMemo(
    () =>
      (Array.isArray(userProjects) ? userProjects : []).map((project) => ({
        id: String(project?.id || ""),
        title: String(project?.title || "").trim(),
        artist: String(project?.artist || "").trim(),
        album: String(project?.album || "").trim(),
      })),
    [userProjects]
  );

  const filteredProjects = useMemo(() => {
    return savedProjects.filter((project) => {
      const matchesSearch = !searchActive
        ? true
        : [project.artist, project.album, project.title].join(" ").toLowerCase().includes(normalizedSearchQuery);
      if (!matchesSearch) return false;
      if (selectedLibraryArtistLabel && project.artist !== selectedLibraryArtistLabel) return false;
      if (selectedLibraryAlbumName && project.album !== selectedLibraryAlbumName) return false;
      return true;
    });
  }, [normalizedSearchQuery, savedProjects, searchActive, selectedLibraryAlbumName, selectedLibraryArtistLabel]);

  const visibleArtists = useMemo(() => {
    const source = searchActive ? filteredProjects : savedProjects;
    return [...new Set(source.map((project) => project.artist).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [filteredProjects, savedProjects, searchActive]);

  const visibleAlbums = useMemo(() => {
    const source = (searchActive ? filteredProjects : savedProjects).filter((project) =>
      selectedLibraryArtistLabel ? project.artist === selectedLibraryArtistLabel : true
    );
    return [...new Set(source.map((project) => project.album).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [filteredProjects, savedProjects, searchActive, selectedLibraryArtistLabel]);

  const visibleSongs = useMemo(() => {
    const source = searchActive ? filteredProjects : savedProjects;
    return source.filter((project) => {
      if (selectedLibraryArtistLabel && project.artist !== selectedLibraryArtistLabel) return false;
      if (selectedLibraryAlbumName && project.album !== selectedLibraryAlbumName) return false;
      return true;
    });
  }, [filteredProjects, savedProjects, searchActive, selectedLibraryAlbumName, selectedLibraryArtistLabel]);

  function clearProjectsSelection() {
    setSelectedLibraryArtistKey("");
    setSelectedLibraryAlbumName("");
    setSelectedLibrarySongName("");
    setArtist("");
    setAlbumName("");
  }

  function renderArtistRow(artistName) {
    const active = selectedLibraryArtistLabel === artistName;
    return (
      <button
        key={artistName}
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
          ...(active ? selectorRowSelectedStyle : selectorRowStyle),
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "center",
          gap: 6,
          textAlign: "left",
          background: active ? withAlpha(THEME.accent, 0.04) : withAlpha(THEME.text, 0.012),
          borderColor: active ? withAlpha(THEME.accent, 0.34) : withAlpha(THEME.text, 0.1),
          color: active ? THEME.accent : THEME.text,
          cursor: "pointer",
          outline: "none",
        }}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artistName}</span>
      </button>
    );
  }

  function renderAlbumRow(albumName) {
    const active = selectedLibraryAlbumName === albumName;
    return (
      <button
        key={albumName}
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
          ...(active ? selectorRowSelectedStyle : selectorRowStyle),
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "center",
          gap: 6,
          textAlign: "left",
          background: active ? withAlpha(THEME.accent, 0.04) : withAlpha(THEME.text, 0.012),
          borderColor: active ? withAlpha(THEME.accent, 0.34) : withAlpha(THEME.text, 0.1),
          color: active ? THEME.accent : THEME.text,
          cursor: "pointer",
          outline: "none",
        }}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{albumName}</span>
      </button>
    );
  }

  function renderSongRow(project) {
    const active = String(currentProjectId || "") === String(project.id || "");
    const busy = String(projectActionBusyId || "") === String(project.id || "");
    return (
      <div key={project.id || `${project.artist}__${project.album}__${project.title}`}>
        <div
          style={{
            ...(active ? selectorRowSelectedStyle : selectorRowStyle),
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            borderColor: active ? withAlpha(THEME.accent, 0.34) : withAlpha(THEME.text, 0.1),
            background: active ? withAlpha(THEME.accent, 0.04) : withAlpha(THEME.text, 0.012),
            color: active ? THEME.accent : THEME.text,
            outline: "none",
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
            disabled={busy}
            style={{ ...btnSecondary, height: 28, padding: "0 9px", fontSize: 11, borderRadius: 8 }}
          >
            {busy ? "Opening..." : "Open"}
          </button>
        </div>
      </div>
    );
  }

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
              ) : visibleAlbums.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {selectedLibraryArtistLabel
                    ? "No albums found for this artist."
                    : searchActive
                    ? "No matching albums."
                    : "No saved albums yet."}
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
                  {searchActive ? "No matching songs." : "No saved songs yet."}
                </div>
              ) : (
                visibleSongs.map((project) => renderSongRow(project))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
