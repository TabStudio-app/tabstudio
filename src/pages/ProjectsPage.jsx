import React, { useState } from "react";
import { buttonMicro, cardDense, menuItem, menuItemSelected } from "../utils/uiTokens";

export default function ProjectsPage({ shared }) {
  const PROJECTS_HEADER_CLEARANCE = 66;
  const PROJECTS_SECTION_GAP = 12;
  const {
    actionDeleteBtn,
    actionEditBtn,
    albumCreateOpen,
    artistCreateOpen,
    availableArtistNames,
    btnSecondary,
    btnSmallPillClose,
    confirmCreateArtist,
    confirmCreateLibraryAlbum,
    confirmCreateLibrarySong,
    EditIcon,
    field,
    libraryAlbumCreateOpen,
    libraryNewAlbumDraft,
    libraryNewAlbumInputRef,
    libraryNewSongDraft,
    libraryNewSongInputRef,
    librarySongCreateOpen,
    loadLibrarySongByPath,
    microBtnHoverHandlers,
    microBtnInteractiveStyle,
    moveLibraryAlbum,
    moveLibraryArtist,
    moveLibrarySong,
    moveLibrarySongToAlbum,
    newArtistDraft,
    newArtistInputRef,
    NO_ALBUM_NAME,
    pressHandlers,
    projectsLibraryOpen,
    renameLibraryAlbum,
    renameLibraryArtist,
    renameLibrarySong,
    requestDeleteLibrarySong,
    userProjects,
    projectsLoading,
    projectsLoadError,
    projectActionBusyId,
    refreshUserProjects,
    openSupabaseProject,
    currentProjectId,
    selectedLibraryAlbumName,
    selectedLibraryAlbums,
    selectedLibraryArtistLabel,
    selectedLibrarySongName,
    selectedLibrarySongs,
    setAlbumCreateOpen,
    setAlbumName,
    setArtist,
    setArtistCreateOpen,
    setLibraryAlbumCreateOpen,
    setLibraryNewAlbumDraft,
    setLibraryNewSongDraft,
    setLibrarySongCreateOpen,
    setNewArtistDraft,
    setProjectsLibraryOpen,
    setSelectedLibraryAlbumName,
    setSelectedLibraryArtistKey,
    setSelectedLibrarySongName,
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
  const [dragItem, setDragItem] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState("");
  const [unassignedAlbumsOpen, setUnassignedAlbumsOpen] = useState(false);
  const [unassignedSongsOpen, setUnassignedSongsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const hasProjectsSelection = Boolean(selectedLibraryArtistLabel || selectedLibraryAlbumName);
  const selectedLibraryArtistMatch = selectedLibraryArtistLabel || "Unsorted";
  const hasAnySongs = selectedLibrarySongs.length > 0;
  const assignedAlbums = selectedLibraryAlbums.filter((albumEntry) => albumEntry.artistName !== "Unsorted");
  const unassignedAlbums = selectedLibraryAlbums.filter((albumEntry) => albumEntry.artistName === "Unsorted");
  const visibleAssignedAlbums = selectedLibraryArtistLabel
    ? assignedAlbums.filter((albumEntry) => albumEntry.artistName === selectedLibraryArtistLabel)
    : [];
  const unassignedSongs = selectedLibrarySongs.filter((songEntry) => songEntry.albumName === NO_ALBUM_NAME);
  const songGroupsByAlbum = selectedLibrarySongs.reduce((groups, songEntry) => {
    if (songEntry.albumName === NO_ALBUM_NAME) return groups;
    const key = `${songEntry.artistName}__${songEntry.albumName}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        artistName: songEntry.artistName,
        albumName: songEntry.albumName,
        songs: [],
      };
    }
    groups[key].songs.push(songEntry);
    return groups;
  }, {});
  const groupedAssignedSongs = Object.values(songGroupsByAlbum).sort(
    (a, b) => a.albumName.localeCompare(b.albumName) || a.artistName.localeCompare(b.artistName)
  );
  const songAlbumSections = selectedLibraryAlbums
    .filter((albumEntry) => albumEntry.albumName !== NO_ALBUM_NAME)
    .map((albumEntry) => ({
      ...albumEntry,
      songs:
        groupedAssignedSongs.find(
          (group) => group.artistName === albumEntry.artistName && group.albumName === albumEntry.albumName
        )?.songs || [],
    }));
  const selectedSongAlbumSection =
    songAlbumSections.find(
      (albumEntry) =>
        albumEntry.artistName === (selectedLibraryArtistLabel || "Unsorted") &&
        albumEntry.albumName === selectedLibraryAlbumName
    ) || null;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchActive = normalizedSearchQuery.length > 0;
  const directArtistMatches = new Set(
    availableArtistNames.filter((artistName) => artistName.toLowerCase().includes(normalizedSearchQuery))
  );
  const directAlbumMatches = new Set(
    selectedLibraryAlbums
      .filter(
        (albumEntry) =>
          albumEntry.artistName.toLowerCase().includes(normalizedSearchQuery) ||
          albumEntry.albumName.toLowerCase().includes(normalizedSearchQuery)
      )
      .map((albumEntry) => albumEntry.key)
  );
  const directSongMatches = new Set(
    selectedLibrarySongs
      .filter(
        (songEntry) =>
          songEntry.artistName.toLowerCase().includes(normalizedSearchQuery) ||
          songEntry.albumName.toLowerCase().includes(normalizedSearchQuery) ||
          songEntry.songName.toLowerCase().includes(normalizedSearchQuery)
      )
      .map((songEntry) => songEntry.key)
  );
  const relatedArtistNames = searchActive ? new Set() : null;
  const relatedAlbumKeys = searchActive ? new Set() : null;
  const relatedSongKeys = searchActive ? new Set() : null;

  if (searchActive) {
    directArtistMatches.forEach((artistName) => {
      relatedArtistNames.add(artistName);
    });
    selectedLibraryAlbums.forEach((albumEntry) => {
      if (directArtistMatches.has(albumEntry.artistName) || directAlbumMatches.has(albumEntry.key)) {
        relatedArtistNames.add(albumEntry.artistName);
        relatedAlbumKeys.add(albumEntry.key);
      }
    });
    selectedLibrarySongs.forEach((songEntry) => {
      const songAlbumKey = `${songEntry.artistName}__${songEntry.albumName}`;
      if (
        directArtistMatches.has(songEntry.artistName) ||
        directAlbumMatches.has(songAlbumKey) ||
        directSongMatches.has(songEntry.key)
      ) {
        relatedArtistNames.add(songEntry.artistName);
        relatedAlbumKeys.add(songAlbumKey);
        relatedSongKeys.add(songEntry.key);
      }
    });
  }

  const filteredArtistNames = searchActive
    ? availableArtistNames.filter((artistName) => relatedArtistNames.has(artistName))
    : availableArtistNames;
  const filteredVisibleAssignedAlbums = searchActive
    ? assignedAlbums.filter((albumEntry) => relatedAlbumKeys.has(albumEntry.key))
    : visibleAssignedAlbums;
  const filteredUnassignedAlbums = searchActive
    ? unassignedAlbums.filter((albumEntry) => relatedAlbumKeys.has(albumEntry.key))
    : unassignedAlbums;
  const filteredSongAlbumSections = searchActive
    ? songAlbumSections
        .filter((albumEntry) => relatedAlbumKeys.has(albumEntry.key))
        .map((albumEntry) => ({
          ...albumEntry,
          songs: albumEntry.songs.filter((songEntry) => relatedSongKeys.has(songEntry.key)),
        }))
    : [];
  const filteredUnassignedSongs = searchActive
    ? unassignedSongs.filter((songEntry) => relatedSongKeys.has(songEntry.key))
    : unassignedSongs;
  const filteredSavedProjects = Array.isArray(userProjects)
    ? userProjects.filter((project) => {
        if (!searchActive) return true;
        const haystack = [
          String(project?.title || ""),
          String(project?.artist || ""),
          String(project?.album || ""),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearchQuery);
      })
    : [];
  const showUnassignedAlbumsContent = searchActive || unassignedAlbumsOpen;
  const showUnassignedSongsContent = searchActive || unassignedSongsOpen;
  const hasUnassignedAlbums = unassignedAlbums.length > 0;
  const hasUnassignedSongs = unassignedSongs.length > 0;

  function formatSavedProjectLabel(project) {
    const artist = String(project?.artist || "").trim();
    const album = String(project?.album || "").trim();
    const title = String(project?.title || "").trim();

    if (artist && album && title) return `${artist} > ${album} > ${title}`;
    if (artist && title) return `${artist} > ${title}`;
    if (album && title) return `${album} > ${title}`;
    if (title) return title;
    return "Untitled Project";
  }

  function beginLibraryDrag(item, e) {
    setDragItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-tabstudio-library", JSON.stringify(item));
  }

  function getDraggedLibraryItem(e) {
    if (dragItem) return dragItem;
    const raw = e.dataTransfer.getData("application/x-tabstudio-library");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function endLibraryDrag() {
    setDragItem(null);
    setDropTargetKey("");
  }

  function renderCollapsibleHeader(
    label,
    open,
    onToggle,
    { dropActive = false, subdued = false, onDragOver, onDragLeave, onDrop } = {}
  ) {
    return (
      <button
        type="button"
        onClick={onToggle}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          ...field,
          fontWeight: 800,
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: "100%",
          cursor: "pointer",
          textAlign: "left",
          color: subdued ? withAlpha(THEME.text, 0.78) : THEME.text,
          borderColor: dropActive ? withAlpha(THEME.accent, 0.78) : open ? withAlpha(THEME.text, 0.16) : THEME.border,
          background: dropActive
            ? withAlpha(THEME.accent, 0.08)
            : subdued
              ? withAlpha(THEME.text, 0.008)
              : open
                ? withAlpha(THEME.text, 0.025)
                : field.background,
          boxShadow: dropActive ? `0 0 0 1px ${withAlpha(THEME.accent, 0.18)}` : "none",
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            lineHeight: 1.2,
            color: subdued
              ? withAlpha(THEME.text, open ? 0.74 : 0.62)
              : open
                ? withAlpha(THEME.text, 0.92)
                : THEME.text,
          }}
        >
          {label}
        </span>
        <span
          style={{
            opacity: subdued ? 0.68 : 0.95,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 160ms ease",
          }}
        >
          ▼
        </span>
      </button>
    );
  }

  function clearProjectsSelection() {
    setSelectedLibraryArtistKey("");
    setSelectedLibraryAlbumName("");
    setSelectedLibrarySongName("");
    setArtist("");
    setAlbumName("");
  }

  function renderSongRow(songEntry) {
    const { artistName, albumName: album, songName: song } = songEntry;
    const active =
      selectedLibraryArtistMatch === artistName &&
      selectedLibraryAlbumName === album &&
      selectedLibrarySongName === song;
    const isDropTarget = dropTargetKey === `song:${songEntry.key}` && dragItem?.type === "song";

    return (
      <div key={songEntry.key}>
        <div
          draggable
          onDragStart={(e) => {
            beginLibraryDrag({ type: "song", artistName, albumName: album, songName: song, key: songEntry.key }, e);
          }}
          onDragOver={(e) => {
            const payload = getDraggedLibraryItem(e);
            if (!payload || payload.type !== "song" || payload.key === songEntry.key) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dropTargetKey !== `song:${songEntry.key}`) setDropTargetKey(`song:${songEntry.key}`);
          }}
          onDragLeave={() => {
            if (dropTargetKey === `song:${songEntry.key}`) setDropTargetKey("");
          }}
          onDrop={(e) => {
            e.preventDefault();
            const payload = getDraggedLibraryItem(e);
            if (!payload || payload.type !== "song") return;
            moveLibrarySong(payload.artistName, payload.albumName, payload.songName, artistName, album, song);
            endLibraryDrag();
          }}
          onDragEnd={endLibraryDrag}
          style={{
            ...selectorRowStyle,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            borderColor: isDropTarget
              ? withAlpha(THEME.accent, 0.78)
              : active
                ? withAlpha(THEME.accent, 0.34)
                : withAlpha(THEME.text, 0.1),
            background: isDropTarget
              ? withAlpha(THEME.accent, 0.08)
              : active
                ? withAlpha(THEME.accent, 0.04)
                : withAlpha(THEME.text, 0.012),
            color: THEME.text,
            boxShadow: isDropTarget ? `0 0 0 1px ${withAlpha(THEME.accent, 0.18)}` : "none",
            cursor: "default",
            opacity: dragItem?.type === "song" && dragItem?.key === songEntry.key ? 0.72 : 1,
            outline: "none",
          }}
        >
          <span
            style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "grab" }}
            title="Drag to assign"
          >
            {song}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadLibrarySongByPath(artistName, album, song);
            }}
            style={{ ...btnSecondary, height: 28, padding: "0 9px", fontSize: 11, borderRadius: 8 }}
          >
            Load
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              renameLibrarySong(artistName, album, song);
            }}
            style={{ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            title={`Edit ${song}`}
            aria-label={`Edit ${song}`}
          >
            <EditIcon size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              requestDeleteLibrarySong(artistName, album, song);
            }}
            style={{ ...actionDeleteBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  function renderAlbumRow(albumEntry) {
    const { artistName, albumName: album } = albumEntry;
    const active = selectedLibraryArtistMatch === artistName && selectedLibraryAlbumName === album;
    const isDropTarget = dropTargetKey === `album:${albumEntry.key}` && (dragItem?.type === "song" || dragItem?.type === "album");
    return (
      <div key={albumEntry.key}>
        <div
          draggable
          onDragStart={(e) => {
            beginLibraryDrag({ type: "album", artistName, albumName: album, key: albumEntry.key }, e);
          }}
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            const payload = getDraggedLibraryItem(e);
            if (!payload) return;
            const acceptsSong = payload.type === "song";
            const acceptsAlbum = payload.type === "album" && payload.key !== albumEntry.key;
            if (!acceptsSong && !acceptsAlbum) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dropTargetKey !== `album:${albumEntry.key}`) setDropTargetKey(`album:${albumEntry.key}`);
          }}
          onDragLeave={() => {
            if (dropTargetKey === `album:${albumEntry.key}`) setDropTargetKey("");
          }}
          onDrop={(e) => {
            e.preventDefault();
            const payload = getDraggedLibraryItem(e);
            if (!payload) return;
            if (payload.type === "song") {
              moveLibrarySong(payload.artistName, payload.albumName, payload.songName, artistName, album);
            } else if (payload.type === "album") {
              moveLibraryAlbum(payload.artistName, payload.albumName, artistName, album);
            }
            endLibraryDrag();
          }}
          onDragEnd={endLibraryDrag}
          onClick={() => {
            setSelectedLibraryArtistKey(artistName);
            setSelectedLibraryAlbumName(album);
            setSelectedLibrarySongName("");
            setArtist(artistName);
            setAlbumName(album);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            setSelectedLibraryArtistKey(artistName);
            setSelectedLibraryAlbumName(album);
            setSelectedLibrarySongName("");
            setArtist(artistName);
            setAlbumName(album);
          }}
          style={{
            ...(active ? selectorRowSelectedStyle : selectorRowStyle),
            width: "100%",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 6,
            textAlign: "left",
            borderColor: isDropTarget
              ? withAlpha(THEME.accent, 0.78)
              : active
                ? withAlpha(THEME.accent, 0.34)
                : withAlpha(THEME.text, 0.1),
            background: isDropTarget
              ? withAlpha(THEME.accent, 0.08)
              : active
                ? withAlpha(THEME.accent, 0.04)
                : withAlpha(THEME.text, 0.012),
            color: THEME.text,
            boxShadow: isDropTarget ? `0 0 0 1px ${withAlpha(THEME.accent, 0.18)}` : "none",
            cursor: "pointer",
            opacity: dragItem?.type === "album" && dragItem?.key === albumEntry.key ? 0.72 : 1,
            outline: "none",
          }}
        >
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              renameLibraryAlbum(artistName, album);
            }}
            style={{ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
            title={`Edit ${album}`}
            aria-label={`Edit ${album}`}
          >
            <EditIcon size={12} />
          </button>
        </div>
      </div>
    );
  }

  function renderSongAlbumSection(albumEntry) {
    const { artistName, albumName } = albumEntry;
    const groupKey = albumEntry.key;
    const songs = albumEntry.songs || [];
    const isDropTarget = dropTargetKey === `album-section:${groupKey}` && dragItem?.type === "song";
    return (
      <div key={groupKey} style={{ display: "grid", gap: 6 }}>
        <div
          onDragOver={(e) => {
            const payload = getDraggedLibraryItem(e);
            if (!payload || payload.type !== "song") return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dropTargetKey !== `album-section:${groupKey}`) setDropTargetKey(`album-section:${groupKey}`);
          }}
          onDragLeave={() => {
            if (dropTargetKey === `album-section:${groupKey}`) setDropTargetKey("");
          }}
          onDrop={(e) => {
            e.preventDefault();
            const payload = getDraggedLibraryItem(e);
            if (!payload || payload.type !== "song") return;
            moveLibrarySong(payload.artistName, payload.albumName, payload.songName, artistName, albumName);
            endLibraryDrag();
          }}
          style={{
            display: "grid",
            gap: 6,
            padding: 6,
            borderRadius: 12,
            background: isDropTarget ? withAlpha(THEME.accent, 0.08) : "transparent",
            boxShadow: isDropTarget ? `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.28)}` : "none",
          }}
        >
          <div
            style={{
              padding: "0 4px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: THEME.textFaint,
            }}
          >
            {`Album: ${albumName}`}
            {artistName !== "Unsorted" ? ` • ${artistName}` : ""}
          </div>
          {songs.length > 0 ? (
            songs.map((songEntry) => renderSongRow(songEntry))
          ) : (
            <div
              style={{
                padding: "4px 10px 8px",
                fontSize: 12,
                fontWeight: 700,
                color: withAlpha(THEME.text, 0.48),
              }}
            >
              Drop songs here
            </div>
          )}
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
          gridTemplateRows: `${searchControlHeight}px auto minmax(0, 1fr)`,
          gap: PROJECTS_SECTION_GAP,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          if (e.target === e.currentTarget) clearProjectsSelection();
        }}
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
              placeholder="Search projects, artists, albums, or songs..."
              aria-label="Search projects, artists, albums, or songs"
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

        <div style={{ ...denseCard, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Saved Projects</div>
              <div style={{ fontSize: 12, color: withAlpha(THEME.text, 0.66) }}>
                Supabase-backed projects for your account.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void refreshUserProjects();
              }}
              style={{ ...btnSecondary, height: 34, padding: "0 12px", fontSize: 12, fontWeight: 800 }}
            >
              Refresh
            </button>
          </div>
          {projectsLoadError ? (
            <div
              style={{
                border: `1px solid ${withAlpha(THEME.danger, 0.24)}`,
                background: withAlpha(THEME.danger, 0.08),
                color: THEME.danger,
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {projectsLoadError}
            </div>
          ) : null}
          <div style={{ display: "grid", gap: 8 }}>
            {projectsLoading ? (
              <div style={{ fontSize: 13, color: THEME.textFaint, padding: "4px 2px" }}>Loading projects...</div>
            ) : filteredSavedProjects.length > 0 ? (
              filteredSavedProjects.map((project) => {
                const active = String(currentProjectId || "") === String(project?.id || "");
                const busy = String(projectActionBusyId || "") === String(project?.id || "");
                return (
                  <div
                    key={project.id}
                    style={{
                      border: `1px solid ${active ? withAlpha(THEME.accent, 0.48) : THEME.border}`,
                      background: active ? withAlpha(THEME.accent, 0.06) : withAlpha(THEME.text, 0.012),
                      borderRadius: 14,
                      padding: "10px 12px",
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0, display: "grid", gap: 4 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: THEME.text,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatSavedProjectLabel(project)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void openSupabaseProject(project.id);
                      }}
                      disabled={busy}
                      style={{ ...btnSecondary, height: 34, padding: "0 12px", fontSize: 12, fontWeight: 800 }}
                    >
                      {busy ? "Opening..." : "Open"}
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: 13, color: THEME.textFaint, padding: "4px 2px" }}>
                {searchActive ? "No matching saved projects." : "Save from the editor to create your first Supabase project."}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
            gap: 10,
            minHeight: 0,
            alignItems: "start",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) clearProjectsSelection();
          }}
        >
          <div
            style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) clearProjectsSelection();
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Artists</div>
              <button
                type="button"
                onClick={() => {
                  setArtistCreateOpen(true);
                  setNewArtistDraft("");
                  setAlbumCreateOpen(false);
                }}
                {...microBtnHoverHandlers("projectsArtistAdd")}
                {...pressHandlers("projectsArtistAdd")}
                style={microBtnInteractiveStyle(
                  "projectsArtistAdd",
                  { ...btnSmallPillClose, height: 28, padding: "0 10px", fontSize: 14, fontWeight: 900 },
                  false
                )}
                title="Create artist"
              >
                +
              </button>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {artistCreateOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 6 }}>
                  <input
                    id="projects-artist-new-input"
                    ref={newArtistInputRef}
                    value={newArtistDraft}
                    onChange={(e) => setNewArtistDraft(e.target.value)}
                    placeholder="New artist name"
                    style={{ ...field, height: 36, minHeight: 36, fontWeight: 800, boxSizing: "border-box" }}
                    onBlur={() => {
                      if (String(newArtistDraft || "").trim()) return;
                      setArtistCreateOpen(false);
                      setNewArtistDraft("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmCreateArtist();
                        return;
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setArtistCreateOpen(false);
                        setNewArtistDraft("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setArtistCreateOpen(false);
                      setNewArtistDraft("");
                    }}
                    style={{ ...btnSmallPillClose, height: 36, padding: "0 10px", fontSize: 12 }}
                    title="Cancel"
                    aria-label="Cancel new artist"
                  >
                    ×
                  </button>
                </div>
              )}
              {filteredArtistNames.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  {searchActive ? "No matching artists." : <>Press <b>+</b> to create your first artist.</>}
                </div>
              ) : (
                filteredArtistNames.map((artistName) => {
                  const active = selectedLibraryArtistLabel === artistName;
                  const isDropTarget =
                    dropTargetKey === `artist:${artistName}` &&
                    (dragItem?.type === "artist" || dragItem?.type === "album" || dragItem?.type === "song");
                  return (
                    <div key={artistName}>
                      <div
                        draggable
                        role="button"
                        tabIndex={0}
                        onDragStart={(e) => {
                          beginLibraryDrag({ type: "artist", artistName, key: artistName }, e);
                        }}
                        onDragOver={(e) => {
                          const payload = getDraggedLibraryItem(e);
                          if (!payload) return;
                          const acceptsArtist = payload.type === "artist" && payload.artistName !== artistName;
                          const acceptsAlbum = payload.type === "album";
                          const acceptsSong = payload.type === "song";
                          if (!acceptsArtist && !acceptsAlbum && !acceptsSong) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dropTargetKey !== `artist:${artistName}`) setDropTargetKey(`artist:${artistName}`);
                        }}
                        onDragLeave={() => {
                          if (dropTargetKey === `artist:${artistName}`) setDropTargetKey("");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const payload = getDraggedLibraryItem(e);
                          if (!payload) return;
                          if (payload.type === "artist") {
                            moveLibraryArtist(payload.artistName, artistName);
                          } else if (payload.type === "album") {
                            moveLibraryAlbum(payload.artistName, payload.albumName, artistName);
                          } else if (payload.type === "song") {
                            moveLibrarySong(payload.artistName, payload.albumName, payload.songName, artistName, NO_ALBUM_NAME);
                          }
                          endLibraryDrag();
                        }}
                        onDragEnd={endLibraryDrag}
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
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          setSelectedLibraryArtistKey(artistName);
                          setSelectedLibraryAlbumName("");
                          setSelectedLibrarySongName("");
                          setArtist(artistName);
                          setAlbumName("");
                        }}
                        style={{
                          ...btnSecondary,
                          width: "100%",
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          alignItems: "center",
                          gap: 6,
                          textAlign: "left",
                          background: isDropTarget
                            ? withAlpha(THEME.accent, 0.08)
                            : active
                              ? withAlpha(THEME.accent, 0.04)
                              : THEME.surfaceWarm,
                          borderColor: isDropTarget
                            ? withAlpha(THEME.accent, 0.78)
                            : active
                              ? withAlpha(THEME.accent, 0.7)
                              : THEME.border,
                          color: active ? THEME.accent : THEME.text,
                          boxShadow: isDropTarget ? `0 0 0 1px ${withAlpha(THEME.accent, 0.18)}` : "none",
                          cursor: "pointer",
                          opacity: dragItem?.type === "artist" && dragItem?.artistName === artistName ? 0.72 : 1,
                        }}
                      >
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {artistName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            renameLibraryArtist(artistName);
                          }}
                          style={{ ...actionEditBtn, height: 28, width: 28, minWidth: 28, borderRadius: 8 }}
                          title={`Edit ${artistName}`}
                          aria-label={`Edit ${artistName}`}
                        >
                          <EditIcon size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedLibraryAlbumName("");
                setSelectedLibrarySongName("");
                setAlbumName("");
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Albums</div>
              <button
                type="button"
                onClick={() => {
                  setLibraryAlbumCreateOpen(true);
                  setLibraryNewAlbumDraft("");
                  setLibrarySongCreateOpen(false);
                  setLibraryNewSongDraft("");
                }}
                {...microBtnHoverHandlers("projectsAlbumAdd")}
                {...pressHandlers("projectsAlbumAdd")}
                style={microBtnInteractiveStyle(
                  "projectsAlbumAdd",
                  {
                    ...btnSmallPillClose,
                    height: 28,
                    padding: "0 10px",
                    fontSize: 14,
                    fontWeight: 900,
                  },
                  false
                )}
                title="Create album"
              >
                +
              </button>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {libraryAlbumCreateOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 6 }}>
                  <input
                    ref={libraryNewAlbumInputRef}
                    value={libraryNewAlbumDraft}
                    onChange={(e) => setLibraryNewAlbumDraft(e.target.value)}
                    placeholder="New album name"
                    style={{ ...field, height: 36, minHeight: 36, fontWeight: 800, boxSizing: "border-box" }}
                    onBlur={() => {
                      if (String(libraryNewAlbumDraft || "").trim()) {
                        confirmCreateLibraryAlbum();
                        return;
                      }
                      setLibraryAlbumCreateOpen(false);
                      setLibraryNewAlbumDraft("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmCreateLibraryAlbum();
                        return;
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setLibraryAlbumCreateOpen(false);
                        setLibraryNewAlbumDraft("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLibraryAlbumCreateOpen(false);
                      setLibraryNewAlbumDraft("");
                    }}
                    style={{ ...btnSmallPillClose, height: 36, padding: "0 10px", fontSize: 12 }}
                    title="Cancel"
                    aria-label="Cancel new album"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedLibraryAlbums.length === 0 ? (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  Press <b>+</b> to create your first album.
                </div>
              ) : searchActive ? (
                filteredVisibleAssignedAlbums.length > 0 ? (
                  filteredVisibleAssignedAlbums.map((albumEntry) => renderAlbumRow(albumEntry))
                ) : (
                  <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                    No matching albums.
                  </div>
                )
              ) : selectedLibraryArtistLabel ? (
                visibleAssignedAlbums.length > 0 ? (
                  visibleAssignedAlbums.map((albumEntry) => renderAlbumRow(albumEntry))
                ) : (
                  <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                    No albums found for this artist yet.
                  </div>
                )
              ) : (
                <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                  Select an artist to browse albums.
                </div>
              )}
              {hasUnassignedAlbums ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {renderCollapsibleHeader("Unassigned Albums", unassignedAlbumsOpen, () =>
                    setUnassignedAlbumsOpen((prev) => !prev),
                    {
                      dropActive: dropTargetKey === "unassigned-albums" && dragItem?.type === "album",
                      subdued: Boolean(selectedLibraryArtistLabel) && !searchActive && !unassignedAlbumsOpen,
                      onDragOver: (e) => {
                        const payload = getDraggedLibraryItem(e);
                        if (!payload || payload.type !== "album") return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dropTargetKey !== "unassigned-albums") setDropTargetKey("unassigned-albums");
                      },
                      onDragLeave: () => {
                        if (dropTargetKey === "unassigned-albums") setDropTargetKey("");
                      },
                      onDrop: (e) => {
                        e.preventDefault();
                        const payload = getDraggedLibraryItem(e);
                        if (!payload || payload.type !== "album") return;
                        moveLibraryAlbum(payload.artistName, payload.albumName, "Unsorted");
                        endLibraryDrag();
                      },
                    }
                  )}
                  {filteredUnassignedAlbums.length > 0 ? (
                    showUnassignedAlbumsContent ? filteredUnassignedAlbums.map((albumEntry) => renderAlbumRow(albumEntry)) : null
                  ) : showUnassignedAlbumsContent ? (
                    <div style={{ fontSize: 12, color: THEME.textFaint, padding: "2px 10px 8px" }}>
                      No matching unassigned albums.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{ ...denseCard, minHeight: 0, height: libraryColumnHeight, overflowY: "auto" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedLibraryAlbumName("");
                setSelectedLibrarySongName("");
                setAlbumName("");
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900 }}>Songs</div>
              <button
                type="button"
                onClick={() => {
                  setLibrarySongCreateOpen(true);
                  setLibraryNewSongDraft("");
                  setLibraryAlbumCreateOpen(false);
                  setLibraryNewAlbumDraft("");
                }}
                {...microBtnHoverHandlers("projectsSongAdd")}
                {...pressHandlers("projectsSongAdd")}
                style={microBtnInteractiveStyle(
                  "projectsSongAdd",
                  {
                    ...btnSmallPillClose,
                    height: 28,
                    padding: "0 10px",
                    fontSize: 14,
                    fontWeight: 900,
                  },
                  false
                )}
                title="Create song"
              >
                +
              </button>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {librarySongCreateOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 6 }}>
                  <input
                    ref={libraryNewSongInputRef}
                    value={libraryNewSongDraft}
                    onChange={(e) => setLibraryNewSongDraft(e.target.value)}
                    placeholder="New song name"
                    style={{ ...field, height: 36, minHeight: 36, fontWeight: 800, boxSizing: "border-box" }}
                    onBlur={() => {
                      if (String(libraryNewSongDraft || "").trim()) {
                        confirmCreateLibrarySong();
                        return;
                      }
                      setLibrarySongCreateOpen(false);
                      setLibraryNewSongDraft("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmCreateLibrarySong();
                        return;
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setLibrarySongCreateOpen(false);
                        setLibraryNewSongDraft("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLibrarySongCreateOpen(false);
                      setLibraryNewSongDraft("");
                    }}
                    style={{ ...btnSmallPillClose, height: 36, padding: "0 10px", fontSize: 12 }}
                    title="Cancel"
                    aria-label="Cancel new song"
                  >
                    ×
                  </button>
                </div>
              )}
              <>
                {searchActive ? (
                  filteredSongAlbumSections.length > 0 ? (
                    filteredSongAlbumSections.map((albumEntry) => renderSongAlbumSection(albumEntry))
                  ) : (
                    <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                      No matching songs.
                    </div>
                  )
                ) : selectedSongAlbumSection ? (
                  renderSongAlbumSection(selectedSongAlbumSection)
                ) : selectedLibraryArtistLabel ? (
                  <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                    Select an album to browse songs.
                  </div>
                ) : hasProjectsSelection ? (
                  <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                    Select an artist and album to organise songs.
                  </div>
                ) : hasAnySongs ? (
                  <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                    Select an album to view assigned songs.
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                    Press <b>+</b> to create your first song.
                  </div>
                )}
                {hasUnassignedSongs ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {renderCollapsibleHeader("Unassigned Songs", unassignedSongsOpen, () =>
                      setUnassignedSongsOpen((prev) => !prev),
                      {
                        dropActive: dropTargetKey === "unassigned-songs" && dragItem?.type === "song",
                        subdued:
                          Boolean(selectedLibraryArtistLabel || selectedLibraryAlbumName) &&
                          !searchActive &&
                          !unassignedSongsOpen,
                        onDragOver: (e) => {
                          const payload = getDraggedLibraryItem(e);
                          if (!payload || payload.type !== "song") return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dropTargetKey !== "unassigned-songs") setDropTargetKey("unassigned-songs");
                        },
                        onDragLeave: () => {
                          if (dropTargetKey === "unassigned-songs") setDropTargetKey("");
                        },
                        onDrop: (e) => {
                          e.preventDefault();
                          const payload = getDraggedLibraryItem(e);
                          if (!payload || payload.type !== "song") return;
                          moveLibrarySong(payload.artistName, payload.albumName, payload.songName, "Unsorted", NO_ALBUM_NAME);
                          endLibraryDrag();
                        },
                      }
                    )}
                    {filteredUnassignedSongs.length > 0 ? (
                      showUnassignedSongsContent ? filteredUnassignedSongs.map((songEntry) => renderSongRow(songEntry)) : null
                    ) : showUnassignedSongsContent ? (
                      <div style={{ fontSize: 12, color: THEME.textFaint, padding: "2px 10px 8px" }}>
                        No matching unassigned songs.
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
