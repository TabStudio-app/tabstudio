import React, { useState } from "react";
import { editorOptionClass } from "../utils/uiStyles";
import { buttonMicro, cardBase, menuItem, menuItemSelected, menuPanel, metadataFieldInteraction, metadataTriggerText } from "../utils/uiTokens";

export default function EditorMetadataPanel({ shared }) {
  const {
    actionDeleteBtn,
    albumCreateOpen,
    albumMenuOpen,
    albumMenuRef,
    albumSelectRef,
    albumsForCurrentArtist,
    appToLowToHigh,
    artistCreateOpen,
    artistMenuOpen,
    artistMenuRef,
    artistSelectRef,
    availableArtistNames,
    btnSecondary,
    capoBtnRef,
    capoEnabled,
    capoFret,
    capoFretFocused,
    capoInputRef,
    capoLabel,
    capoOpen,
    capoPanelRef,
    capoReplaceOnTypeRef,
    capoSectionRef,
    cellSize,
    confirmCreateAlbum,
    confirmCreateArtist,
    currentInstrument,
    customOpen,
    customTuningAddBtnRef,
    deleteUserTuning,
    effectiveAlbumLabel,
    effectiveArtistLabel,
    expandedInstrumentGroup,
    favInstrumentIds,
    favouriteInstruments,
    field,
    focusKeyCapture,
    formatLowToHighString,
    formatTuningName,
    groupedInstruments,
    handleInstrumentChange,
    instrumentBtnRef,
    instrumentId,
    instrumentOpen,
    instrumentPanelRef,
    instrumentSectionRef,
    isDarkMode,
    newAlbumDraft,
    newAlbumInputRef,
    newArtistDraft,
    newArtistInputRef,
    pillMono,
    resetCustomFormToCurrent,
    setAlbumCreateOpen,
    setAlbumMenuOpen,
    setAlbumName,
    setArtist,
    setArtistCreateOpen,
    setArtistMenuOpen,
    setCapoEnabled,
    setCapoFret,
    setCapoFretFocused,
    setCapoOpen,
    setCapoReplaceOnType,
    setCustomOpen,
    setExpandedInstrumentGroup,
    setInstrumentOpen,
    setNewAlbumDraft,
    setNewArtistDraft,
    setSongTitle,
    setTuningOpen,
    showCapoControl,
    showTempoControl,
    songMetaGridColumns,
    songMetaSectionRef,
    songTitle,
    songTitleInputRef,
    tabbyTourHighlightClassFor,
    tempoPanelNode,
    THEME,
    toggleFavouriteInstrument,
    tr,
    tuning,
    tuningBtnRef,
    tuningLabel,
    tuningMatchesCurrent,
    tuningOpen,
    tuningPanelRef,
    tuningSectionRef,
    userTuningsById,
    validateCapo,
    withAlpha,
    allTunings,
    applyTuningOption,
  } = shared;
  const [songNameFocused, setSongNameFocused] = useState(false);
  const [songNameHovered, setSongNameHovered] = useState(false);

  const baseCard = cardBase(THEME);
  const microButton = buttonMicro(THEME);
  const panelStyle = menuPanel(THEME);
  const defaultMenuItemStyle = menuItem(THEME);
  const selectedMenuItemStyle = menuItemSelected(THEME);
  const songNameTextStyle = metadataTriggerText(THEME, withAlpha, { placeholder: !String(songTitle || "").trim() });
  const songNameInteractionStyle = metadataFieldInteraction(THEME, withAlpha, {
    focused: songNameFocused,
    hovered: songNameHovered,
  });
  const artistTriggerHasValue = Boolean(effectiveArtistLabel);
  const artistTriggerTextStyle = metadataTriggerText(THEME, withAlpha, { placeholder: !artistTriggerHasValue });
  const albumTriggerHasValue = Boolean(effectiveAlbumLabel);
  const albumTriggerTextStyle = metadataTriggerText(THEME, withAlpha, { placeholder: !albumTriggerHasValue });
  const instrumentTriggerTextStyle = metadataTriggerText(THEME, withAlpha);
  const tuningTriggerTextStyle = metadataTriggerText(THEME, withAlpha);
  const capoTriggerTextStyle = metadataTriggerText(THEME, withAlpha);

  return (
    <div
      ref={songMetaSectionRef}
      style={{ ...baseCard }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: songMetaGridColumns,
          gap: 12,
          alignItems: "center",
        }}
      >
        <div className={tabbyTourHighlightClassFor("song-name")} style={{ minWidth: 0 }}>
          <label
            htmlFor="song-name-input"
            style={{
              display: "block",
              margin: "0 0 7px 10px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
              lineHeight: 1.1,
              cursor: "text",
            }}
          >
            {tr("SONG NAME", "NOMBRE DE LA CANCION")}
          </label>
          <input
            id="song-name-input"
            name="tabstudio-song-name"
            ref={songTitleInputRef}
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onFocus={() => setSongNameFocused(true)}
            onBlur={() => setSongNameFocused(false)}
            onMouseEnter={() => setSongNameHovered(true)}
            onMouseLeave={() => setSongNameHovered(false)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.blur();
              focusKeyCapture();
            }}
            placeholder={tr("Song name", "Nombre de la canción")}
            style={{
              ...field,
              ...songNameInteractionStyle,
              fontSize: songNameTextStyle.fontSize,
              fontWeight: songNameTextStyle.fontWeight,
              lineHeight: songNameTextStyle.lineHeight,
            }}
          />
        </div>
        <div className={tabbyTourHighlightClassFor("artist")} style={{ minWidth: 0 }}>
          <label
            htmlFor={artistCreateOpen ? "artist-new-input" : "artist-select"}
            style={{
              display: "block",
              margin: "0 0 7px 10px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
              lineHeight: 1.1,
              cursor: "text",
            }}
          >
            {tr("ARTIST", "ARTISTA")}
          </label>
          <div style={{ position: "relative" }}>
            {artistCreateOpen ? (
              <input
                id="artist-new-input"
                ref={newArtistInputRef}
                value={newArtistDraft}
                onChange={(e) => setNewArtistDraft(e.target.value)}
                placeholder="New artist name"
                style={{ ...field, fontWeight: 800 }}
                onBlur={() => {
                  if (String(newArtistDraft || "").trim()) {
                    confirmCreateArtist();
                    return;
                  }
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
                    focusKeyCapture();
                    return;
                  }
                  if (e.key === "Tab" && !String(newArtistDraft || "").trim()) {
                    setArtistCreateOpen(false);
                    setNewArtistDraft("");
                  }
                }}
              />
            ) : (
              <>
                <button
                  id="artist-select"
                  ref={artistSelectRef}
                  type="button"
                  onClick={() => {
                    setArtistMenuOpen((v) => !v);
                    setAlbumMenuOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Escape") return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    focusKeyCapture();
                  }}
                  style={{
                    ...field,
                    fontWeight: 800,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderColor: artistMenuOpen ? THEME.accent : THEME.border,
                    boxShadow: artistMenuOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                  }}
                >
                  <span style={artistTriggerTextStyle}>
                    {effectiveArtistLabel || (availableArtistNames.length ? "Select Artist" : "Create Artist")}
                  </span>
                  <span style={{ opacity: 0.95 }}>{artistMenuOpen ? "▲" : "▼"}</span>
                </button>
                {artistMenuOpen && (
                  <div
                    ref={artistMenuRef}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      zIndex: 1000,
                      width: "100%",
                      ...panelStyle,
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 950 }}>Artists</div>
                      <button
                        type="button"
                        onClick={() => {
                          setArtistMenuOpen(false);
                          focusKeyCapture();
                        }}
                        style={{ ...microButton }}
                      >
                        Close
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gap: 6,
                        marginTop: 10,
                        maxHeight: 300,
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                        paddingRight: 4,
                      }}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {availableArtistNames.map((name) => {
                        const selected = name === effectiveArtistLabel;
                        return (
                          <button
                            key={name}
                            type="button"
                            className={editorOptionClass}
                            aria-selected={selected}
                            onClick={() => {
                              setArtistCreateOpen(false);
                              setNewArtistDraft("");
                              if (selected) {
                                setArtist("");
                                setAlbumName("");
                              } else {
                                setArtist(name);
                                setAlbumName("");
                              }
                              setArtistMenuOpen(false);
                              focusKeyCapture();
                            }}
                            style={{
                              ...(selected ? selectedMenuItemStyle : defaultMenuItemStyle),
                            }}
                          >
                            <span>{name}</span>
                            <span />
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className={editorOptionClass}
                        aria-selected={false}
                        onClick={() => {
                          setArtistMenuOpen(false);
                          setNewArtistDraft("");
                          setArtistCreateOpen(true);
                          setAlbumCreateOpen(false);
                        }}
                        style={{
                          ...defaultMenuItemStyle,
                        }}
                      >
                        <span>+ New artist...</span>
                        <span />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className={tabbyTourHighlightClassFor("album")} style={{ minWidth: 0 }}>
          <label
            htmlFor={albumCreateOpen ? "album-new-input" : "album-select"}
            style={{
              display: "block",
              margin: "0 0 7px 10px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
              lineHeight: 1.1,
              cursor: "text",
            }}
          >
            {tr("ALBUM", "ALBUM")}
          </label>
          <div style={{ position: "relative" }}>
            {albumCreateOpen ? (
              <input
                id="album-new-input"
                ref={newAlbumInputRef}
                value={newAlbumDraft}
                onChange={(e) => setNewAlbumDraft(e.target.value)}
                placeholder="New album name"
                style={{ ...field, fontWeight: 800 }}
                onBlur={() => {
                  if (String(newAlbumDraft || "").trim()) {
                    confirmCreateAlbum();
                    return;
                  }
                  setAlbumCreateOpen(false);
                  setNewAlbumDraft("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmCreateAlbum();
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setAlbumCreateOpen(false);
                    setNewAlbumDraft("");
                    focusKeyCapture();
                    return;
                  }
                  if (e.key === "Tab" && !String(newAlbumDraft || "").trim()) {
                    setAlbumCreateOpen(false);
                    setNewAlbumDraft("");
                  }
                }}
              />
            ) : (
              <>
                <button
                  id="album-select"
                  ref={albumSelectRef}
                  type="button"
                  onClick={() => {
                    setAlbumMenuOpen((v) => !v);
                    setArtistMenuOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Escape") return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    focusKeyCapture();
                  }}
                  style={{
                    ...field,
                    fontWeight: 800,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderColor: albumMenuOpen ? THEME.accent : THEME.border,
                    boxShadow: albumMenuOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                  }}
                >
                  <span style={albumTriggerTextStyle}>
                    {effectiveAlbumLabel ||
                      (effectiveArtistLabel
                        ? albumsForCurrentArtist.length
                          ? "Select Album"
                          : "Create Album"
                        : "Select Album")}
                  </span>
                  <span style={{ opacity: 0.95 }}>{albumMenuOpen ? "▲" : "▼"}</span>
                </button>
                {albumMenuOpen && (
                  <div
                    ref={albumMenuRef}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      zIndex: 1000,
                      width: "100%",
                      ...panelStyle,
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 950 }}>Albums</div>
                      <button
                        type="button"
                        onClick={() => {
                          setAlbumMenuOpen(false);
                          focusKeyCapture();
                        }}
                        style={{ ...microButton }}
                      >
                        Close
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gap: 6,
                        marginTop: 10,
                        maxHeight: 300,
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                        paddingRight: 4,
                      }}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {!effectiveArtistLabel && (
                        <div
                          style={{
                            padding: "8px 4px 6px",
                            fontSize: 13,
                            color: withAlpha(THEME.text, 0.74),
                          }}
                        >
                          Select an artist first.
                        </div>
                      )}
                      {albumsForCurrentArtist.map((name) => {
                        const selected = name === effectiveAlbumLabel;
                        return (
                          <button
                            key={name}
                            type="button"
                            className={editorOptionClass}
                            aria-selected={selected}
                            onClick={() => {
                              setAlbumCreateOpen(false);
                              setNewAlbumDraft("");
                              if (selected) {
                                setAlbumName("");
                              } else {
                                setAlbumName(name);
                              }
                              setAlbumMenuOpen(false);
                              focusKeyCapture();
                            }}
                            style={{
                              ...(selected ? selectedMenuItemStyle : defaultMenuItemStyle),
                            }}
                          >
                            <span>{name}</span>
                            <span />
                          </button>
                        );
                      })}
                      {effectiveArtistLabel && (
                        <button
                          type="button"
                          className={editorOptionClass}
                          aria-selected={false}
                          onClick={() => {
                            setAlbumMenuOpen(false);
                            setNewAlbumDraft("");
                            setAlbumCreateOpen(true);
                            setArtistCreateOpen(false);
                          }}
                          style={{
                            ...defaultMenuItemStyle,
                          }}
                        >
                          <span>+ New album...</span>
                          <span />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: songMetaGridColumns,
          gap: 12,
          marginTop: 12,
          alignItems: "center",
        }}
      >
        <div
          ref={instrumentSectionRef}
          className={tabbyTourHighlightClassFor("instrument")}
          style={{ minWidth: 0, position: "relative" }}
        >
          <label
            style={{
              display: "block",
              margin: "0 0 7px 10px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
              lineHeight: 1.1,
            }}
          >
            INSTRUMENT
          </label>
          <button
            ref={instrumentBtnRef}
            type="button"
            onClick={() => setInstrumentOpen((v) => !v)}
            style={{
              ...field,
              width: "100%",
              textAlign: "left",
              fontWeight: 800,
              fontFamily: "inherit",
              fontSize: 16,
              lineHeight: 1.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              borderColor: instrumentOpen ? THEME.accent : THEME.border,
              boxShadow: instrumentOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
            }}
          >
            <span style={instrumentTriggerTextStyle}>{`${currentInstrument.stringCount} String ${currentInstrument.group}`}</span>
            <span style={{ opacity: 0.95 }}>{instrumentOpen ? "▲" : "▼"}</span>
          </button>
          {instrumentOpen && (
            <div
              ref={instrumentPanelRef}
              style={{
                position: "absolute",
                top: 74,
                left: 0,
                zIndex: 1000,
                width: "100%",
                ...panelStyle,
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div style={{ fontWeight: 950 }}>Instruments</div>
                <button
                  type="button"
                  onClick={() => {
                    setInstrumentOpen(false);
                    focusKeyCapture();
                  }}
                  style={{ ...microButton }}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  maxHeight: 340,
                  overflowY: "auto",
                  paddingRight: 4,
                  display: "grid",
                  gap: 6,
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {[
                  { group: "Favourites", items: favouriteInstruments, isFavourites: true },
                  ...groupedInstruments.map((g) => ({ ...g, isFavourites: false })),
                ].map(({ group, items, isFavourites }) => {
                  const expanded = expandedInstrumentGroup === group;
                  return (
                    <div
                      key={group}
                      style={{
                        marginBottom: 6,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedInstrumentGroup((prev) => (prev === group ? null : group))}
                        style={{
                          ...btnSecondary,
                          width: "100%",
                          height: 42,
                          padding: "0 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderRadius: 12,
                          borderColor: expanded ? THEME.accent : THEME.border,
                          background: THEME.surfaceWarm,
                          cursor: "pointer",
                          fontSize: 16,
                          lineHeight: 1,
                          fontWeight: 900,
                          color: THEME.text,
                          boxSizing: "border-box",
                          boxShadow: expanded ? `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.22)}` : "none",
                        }}
                      >
                        <span>{group}</span>
                        <span style={{ fontSize: 13, opacity: 0.95 }}>{expanded ? "▲" : "▼"}</span>
                      </button>
                      {expanded && (
                        <div
                          style={{
                            display: "grid",
                            gap: 6,
                            padding: "6px 4px 2px",
                          }}
                        >
                          {isFavourites && items.length === 0 ? (
                            <div
                              style={{
                                fontSize: 12,
                                color: THEME.textFaint,
                                lineHeight: 1.4,
                                fontWeight: 700,
                                padding: "10px 10px 12px",
                                border: `1px solid ${THEME.border}`,
                                borderRadius: 12,
                                background: THEME.surfaceWarm,
                              }}
                            >
                              You haven&apos;t added any favourites yet. Click the star next to an instrument to add it here.
                            </div>
                          ) : (
                            items.map((inst) => {
                              const active = inst.id === instrumentId;
                              const fav = favInstrumentIds.includes(inst.id);
                              return (
                                <div
                                  key={inst.id}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(0,1fr) auto",
                                    gap: 6,
                                    alignItems: "center",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className={editorOptionClass}
                                    aria-selected={active}
                                    onClick={() => handleInstrumentChange(inst.id)}
                                    style={{
                                      ...(active
                                        ? menuItemSelected(THEME, {
                                            padding: "9px 10px",
                                            borderRadius: 12,
                                            fontWeight: 800,
                                            fontSize: 13,
                                            color: THEME.accent,
                                            boxShadow: `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.2)}`,
                                          })
                                        : menuItem(THEME, {
                                            padding: "9px 10px",
                                            borderRadius: 12,
                                            fontWeight: 800,
                                            fontSize: 13,
                                          })),
                                      gap: 8,
                                    }}
                                    >
                                      <span>{`${inst.stringCount} String ${inst.group}`}</span>
                                      {isFavourites ? (
                                        <span />
                                      
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: 12,
                                          color: THEME.textFaint,
                                          fontWeight: 800,
                                        }}
                                      >
                                        {inst.stringCount} strings
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleFavouriteInstrument(inst.id)}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      border: `1px solid ${THEME.border}`,
                                      borderRadius: 8,
                                      background: "transparent",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      padding: 0,
                                      opacity: fav ? 1 : 0.9,
                                    }}
                                    title={fav ? "Remove from favourites" : "Add to favourites"}
                                  >
                                    <span
                                      style={{
                                        color: fav ? THEME.starActive : THEME.textFaint,
                                        fontSize: 16,
                                      }}
                                    >
                                      {fav ? "★" : "☆"}
                                    </span>
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 6 }}>
                You can mix multiple instruments in the same song – each completed row remembers which instrument it was written for.
              </div>
            </div>
          )}
        </div>
        <div
          ref={tuningSectionRef}
          className={tabbyTourHighlightClassFor("tuning")}
          style={{ minWidth: 0, position: "relative" }}
        >
          <label
            style={{
              display: "block",
              margin: "0 0 7px 10px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
              lineHeight: 1.1,
            }}
          >
            TUNING
          </label>
          <button
            ref={tuningBtnRef}
            type="button"
            onClick={() => {
              setTuningOpen((v) => !v);
              if (!tuningOpen) setCustomOpen(false);
            }}
            style={{
              ...field,
              width: "100%",
              textAlign: "left",
              fontWeight: 800,
              fontFamily: "inherit",
              fontSize: 16,
              lineHeight: 1.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              borderColor: tuningOpen ? THEME.accent : THEME.border,
              boxShadow: tuningOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
              gap: 10,
            }}
          >
            <span
              style={{
                ...tuningTriggerTextStyle,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tuningLabel}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                opacity: 0.72,
                fontWeight: 900,
                color: THEME.textFaint,
                whiteSpace: "nowrap",
              }}
            >
              {formatLowToHighString(appToLowToHigh(tuning))}
            </span>
            <span style={{ opacity: 0.95, marginLeft: 4 }}>{tuningOpen ? "▲" : "▼"}</span>
          </button>
          {tuningOpen && (
            <div
              ref={tuningPanelRef}
              style={{
                position: "absolute",
                top: 74,
                left: 0,
                zIndex: 1000,
                width: "100%",
                ...panelStyle,
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontWeight: 950 }}>Tunings</div>
                <button
                  type="button"
                  onClick={() => {
                    setTuningOpen(false);
                    setCustomOpen(false);
                    focusKeyCapture();
                  }}
                  style={{ ...microButton }}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 6,
                  marginTop: 10,
                  maxHeight: 360,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  paddingRight: 4,
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {allTunings.map((t) => {
                  const isUser = currentInstrument.stringCount === 6 && userTuningsById.has(t.id);
                  const selected = tuningMatchesCurrent(t.lowToHigh);
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        className={editorOptionClass}
                        aria-selected={selected}
                        onClick={() => applyTuningOption(t)}
                        style={{
                          ...defaultMenuItemStyle,
                          minWidth: 0,
                        }}
                      >
                        <span>{formatTuningName(t.name)}</span>
                        <span
                          style={{
                            fontSize: 12,
                            opacity: 0.7,
                            fontWeight: 900,
                            color: THEME.textFaint,
                          }}
                        >
                          {formatLowToHighString(t.lowToHigh)}
                        </span>
                      </button>
                      {isUser ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteUserTuning(t.id);
                          }}
                          title="Delete saved tuning"
                          style={{
                            ...actionDeleteBtn,
                            width: 40,
                            minWidth: 40,
                            height: 40,
                            borderRadius: 12,
                            fontSize: 20,
                          }}
                        >
                          ×
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })}
              </div>

              {currentInstrument.stringCount === 6 && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    ref={customTuningAddBtnRef}
                    className={tabbyTourHighlightClassFor("custom-tunings")}
                    type="button"
                    onClick={() => {
                      resetCustomFormToCurrent();
                      setCustomOpen(true);
                    }}
                    style={{
                      ...btnSecondary,
                      height: 36,
                      padding: "0 10px",
                      borderColor: customOpen ? THEME.accent : THEME.border,
                      background: THEME.surfaceWarm,
                    }}
                  >
                    + Add custom tuning
                  </button>
                </div>
              )}

              <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 10 }}>
                Chord tools currently only work in <b>6-string guitar</b>. Saved chords are shown per tuning.
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            minWidth: 0,
            display: "grid",
            gridTemplateColumns: showCapoControl && showTempoControl ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
            gap: 12,
            alignItems: "start",
          }}
        >
          {showCapoControl && (
            <div
              ref={capoSectionRef}
              className={tabbyTourHighlightClassFor("capo")}
              style={{ minWidth: 0, position: "relative" }}
            >
              <label
                style={{
                  display: "block",
                  margin: "0 0 7px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
                  lineHeight: 1.1,
                }}
              >
                CAPO
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  ref={capoBtnRef}
                  type="button"
                  onClick={() => setCapoOpen((v) => !v)}
                  style={{
                    ...field,
                    flex: 1,
                    textAlign: "left",
                    fontWeight: 800,
                    fontFamily: "inherit",
                    fontSize: 16,
                    lineHeight: 1.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderColor: capoOpen ? THEME.accent : THEME.border,
                    boxShadow: capoOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                  }}
                >
                  <span style={capoTriggerTextStyle}>{capoLabel}</span>
                  <span style={{ opacity: 0.95 }}>{capoOpen ? "▲" : "▼"}</span>
                </button>

                {capoEnabled && (
                  <input
                    ref={capoInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={capoFret}
                    onMouseDown={() => {
                      setCapoReplaceOnType(true);
                      capoReplaceOnTypeRef.current = true;
                    }}
                    onChange={(e) => {
                      const raw = String(e.target.value ?? "").replace(/[^\d]/g, "");
                      setCapoFret(raw);
                      if (!raw) setCapoEnabled(false);
                    }}
                    onFocus={() => {
                      setCapoFretFocused(true);
                      setCapoReplaceOnType(true);
                      capoReplaceOnTypeRef.current = true;
                    }}
                    onBlur={() => {
                      setCapoFretFocused(false);
                      setCapoReplaceOnType(false);
                      capoReplaceOnTypeRef.current = false;
                      validateCapo();
                    }}
                    onKeyDown={(e) => {
                      if (/^\d$/.test(e.key)) {
                        e.preventDefault();
                        const replace = capoReplaceOnTypeRef.current;
                        setCapoFret((prev) => {
                          const base = replace ? "" : String(prev ?? "");
                          return `${base}${e.key}`.replace(/[^\d]/g, "");
                        });
                        if (replace) {
                          setCapoReplaceOnType(false);
                          capoReplaceOnTypeRef.current = false;
                        }
                        return;
                      }
                      if (e.key === "Backspace") {
                        e.preventDefault();
                        setCapoReplaceOnType(false);
                        capoReplaceOnTypeRef.current = false;
                        setCapoFret((prev) => {
                          const next = String(prev ?? "").slice(0, -1);
                          if (!next) setCapoEnabled(false);
                          return next;
                        });
                        return;
                      }
                      if (e.key === "Delete") {
                        e.preventDefault();
                        setCapoReplaceOnType(false);
                        capoReplaceOnTypeRef.current = false;
                        setCapoFret("");
                        setCapoEnabled(false);
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setCapoReplaceOnType(false);
                        capoReplaceOnTypeRef.current = false;
                        const ok = validateCapo();
                        if (ok) {
                          capoInputRef.current?.blur?.();
                          focusKeyCapture();
                        }
                        return;
                      }
                      if (e.key === "Tab") return;
                      e.preventDefault();
                    }}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 12,
                      border: `1px solid ${capoFretFocused ? THEME.accent : THEME.border}`,
                      outline: "none",
                      boxShadow: capoFretFocused ? `0 0 0 3px ${withAlpha(THEME.accent, 0.18)}` : "none",
                      textAlign: "center",
                      ...pillMono,
                      background: THEME.surfaceWarm,
                      color: THEME.text,
                      boxSizing: "border-box",
                      caretColor: "transparent",
                    }}
                    title="Capo fret (1–24)"
                  />
                )}
              </div>

              {capoOpen && (
                <div
                  ref={capoPanelRef}
                  style={{
                    position: "absolute",
                    top: 74,
                    left: 0,
                    zIndex: 1000,
                    width: "100%",
                    ...panelStyle,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>Capo</div>
                    <button
                      type="button"
                      onClick={() => {
                        setCapoOpen(false);
                        focusKeyCapture();
                      }}
                      style={{ ...microButton }}
                    >
                      Close
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <button
                      type="button"
                      className={editorOptionClass}
                      aria-selected={!capoEnabled}
                      onClick={() => {
                        setCapoEnabled(false);
                        setCapoOpen(false);
                        focusKeyCapture();
                      }}
                      style={{
                        ...(!capoEnabled ? selectedMenuItemStyle : defaultMenuItemStyle),
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        boxSizing: "border-box",
                      }}
                    >
                      <span>No</span>
                      <span />
                    </button>

                    <button
                      type="button"
                      className={editorOptionClass}
                      aria-selected={capoEnabled}
                      onClick={() => {
                        setCapoEnabled(true);
                        setCapoOpen(false);
                        setCapoFret("");
                        requestAnimationFrame(() => {
                          try {
                            capoInputRef.current?.focus?.({ preventScroll: true });
                          } catch {
                            capoInputRef.current?.focus?.();
                          }
                        });
                      }}
                      style={{
                        ...(capoEnabled ? selectedMenuItemStyle : defaultMenuItemStyle),
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        boxSizing: "border-box",
                      }}
                    >
                      <span>Yes</span>
                      <span />
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 10 }}>
                    If enabled, enter the fret number in the box (1–24).
                  </div>
                </div>
              )}
            </div>
          )}

          {tempoPanelNode}
        </div>
      </div>
    </div>
  );
}
