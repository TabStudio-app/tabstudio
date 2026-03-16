import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function TabbySpeechBubble({
  theme,
  isDark = true,
  accentColor,
  variant = "assist",
  visible = true,
  children,
  style = {},
  textStyle = {},
  bubbleWidth = 272,
  bubbleMaxWidth = 272,
  pointerEvents = "none",
  tailSide = "right-center",
  tailOffset = 28,
  tailSize = 14,
  showTail = true,
  ariaHidden = true,
  withAlpha,
}) {
  const isNeutralBubble = variant === "neutral" || variant === "normal" || variant === "greeting";
  const borderColor = isNeutralBubble
    ? withAlpha(theme.text, isDark ? 0.2 : 0.16)
    : withAlpha(accentColor || theme.text, isDark ? 0.44 : 0.34);
  const bubbleBg = isNeutralBubble
    ? withAlpha(theme.surfaceWarm || theme.surface || "#121212", isDark ? 0.98 : 0.95)
    : theme.surfaceWarm;
  const tailBase = {
    position: "absolute",
    width: tailSize,
    height: tailSize,
    background: bubbleBg,
    borderRadius: 3,
    transform: "rotate(45deg)",
    pointerEvents: "none",
  };
  let tailStyle = null;
  if (tailSide === "bottom-left") {
    tailStyle = {
      ...tailBase,
      left: tailOffset,
      bottom: Math.round(tailSize * -0.5),
      borderRight: `1px solid ${borderColor}`,
      borderBottom: `1px solid ${borderColor}`,
    };
  } else if (tailSide === "bottom-center") {
    tailStyle = {
      ...tailBase,
      left: "50%",
      bottom: Math.round(tailSize * -0.5),
      marginLeft: Math.round(tailSize * -0.5),
      borderRight: `1px solid ${borderColor}`,
      borderBottom: `1px solid ${borderColor}`,
    };
  } else if (tailSide === "right-center") {
    tailStyle = {
      ...tailBase,
      right: Math.round(tailSize * -0.5),
      top: "50%",
      marginTop: Math.round(tailSize * -0.5),
      borderTop: `1px solid ${borderColor}`,
      borderRight: `1px solid ${borderColor}`,
    };
  }
  return (
    <div
      aria-hidden={ariaHidden}
      style={{
        width: bubbleWidth,
        maxWidth: bubbleMaxWidth,
        borderRadius: 16,
        border: `1px solid ${borderColor}`,
        background: bubbleBg,
        color: isNeutralBubble ? withAlpha(theme.text, isDark ? 0.96 : 0.9) : theme.text,
        padding: "14px 16px",
        fontSize: 13,
        lineHeight: 1.45,
        fontWeight: 700,
        boxShadow: `0 10px 24px ${withAlpha("#000000", isDark ? 0.26 : 0.14)}`,
        boxSizing: "border-box",
        overflowWrap: "anywhere",
        opacity: visible ? 1 : 0,
        pointerEvents,
        position: "relative",
        ...textStyle,
        ...style,
      }}
    >
      {children}
      {showTail && tailStyle ? <span aria-hidden="true" style={tailStyle} /> : null}
    </div>
  );
}

export default function TabbyAssistant({ shared }) {
  const {
    activeGridTabbyTooltipMode,
    activeTabbyTourStep,
    blockTabbyHoverTooltip,
    btnSecondary,
    btnSmallPillClose,
    closeTabbyTourToIdle,
    finishTabbyTour,
    goToMembershipFromFinalTourStep,
    goToNextTabbyTourStep,
    goToPrevTabbyTourStep,
    gridTabbyBubbleLayout,
    gridTabbyBubbleWidth,
    gridTabbyHidden,
    gridTabbyHiding,
    isDarkMode,
    isFinalTabbyTourStep,
    isGridTabbyTooltipVisible,
    isTabbyTourActive,
    lockedFeatureTooltip,
    lockedFeatureTooltipVisible,
    onBecomeMemberFromLockedTooltip,
    onHideAssistant,
    onOpenWalkthrough,
    setBlockTabbyHoverTooltip,
    setIsHoveringTabby,
    setTabbyHoverTooltipVisible,
    showGridTabbyOnboarding,
    TABBY_ASSIST_MINT,
    tabbyDark,
    tabbyLight,
    tabbyTourActionPrimaryClass,
    tabbyTourStepsLength,
    THEME,
    tourStep,
    VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX,
    VIEWPORT_TABBY_BOTTOM_PX,
    VIEWPORT_TABBY_CONTAINER_SIZE_PX,
    VIEWPORT_TABBY_GLOW_SIZE_PX,
    VIEWPORT_TABBY_RIGHT_PX,
    VIEWPORT_TABBY_Z_INDEX,
    withAlpha,
  } = shared;

  const [gridTabbyFloatUp, setGridTabbyFloatUp] = useState(false);
  const [gridTabbyBlink, setGridTabbyBlink] = useState(false);
  const gridTabbyBlinkTimerRef = useRef(null);
  const gridTabbyBlinkLoopTimerRef = useRef(null);
  const gridTabbyClickTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !showGridTabbyOnboarding) return undefined;
    const id = window.setInterval(() => setGridTabbyFloatUp((v) => !v), 2100);
    return () => window.clearInterval(id);
  }, [showGridTabbyOnboarding]);

  useEffect(() => {
    if (typeof window === "undefined" || !showGridTabbyOnboarding) return undefined;
    const scheduleBlink = () => {
      const wait = 2600 + Math.random() * 2000;
      gridTabbyBlinkLoopTimerRef.current = window.setTimeout(() => {
        setGridTabbyBlink(true);
        gridTabbyBlinkTimerRef.current = window.setTimeout(() => {
          setGridTabbyBlink(false);
        }, 170);
        scheduleBlink();
      }, wait);
    };
    scheduleBlink();
    return () => {
      if (gridTabbyBlinkLoopTimerRef.current) window.clearTimeout(gridTabbyBlinkLoopTimerRef.current);
      if (gridTabbyBlinkTimerRef.current) window.clearTimeout(gridTabbyBlinkTimerRef.current);
      setGridTabbyBlink(false);
    };
  }, [showGridTabbyOnboarding]);

  useEffect(
    () => () => {
      if (gridTabbyClickTimerRef.current) window.clearTimeout(gridTabbyClickTimerRef.current);
    },
    []
  );

  const handleGridTabbySingleClick = () => {
    if (gridTabbyHidden || gridTabbyHiding) return;
    if (gridTabbyClickTimerRef.current) {
      window.clearTimeout(gridTabbyClickTimerRef.current);
      gridTabbyClickTimerRef.current = null;
    }
    gridTabbyClickTimerRef.current = window.setTimeout(() => {
      onOpenWalkthrough?.();
      gridTabbyClickTimerRef.current = null;
    }, 210);
  };

  const handleGridTabbyDoubleClick = () => {
    if (gridTabbyClickTimerRef.current) {
      window.clearTimeout(gridTabbyClickTimerRef.current);
      gridTabbyClickTimerRef.current = null;
    }
    onHideAssistant?.();
  };

  const showTemporaryLockedTabby = gridTabbyHidden && lockedFeatureTooltipVisible;
  const canRenderLockedPrompt = lockedFeatureTooltipVisible;

  if (
    (!showGridTabbyOnboarding && !canRenderLockedPrompt) ||
    ((gridTabbyHidden && !gridTabbyHiding && !showTemporaryLockedTabby)) ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        right: VIEWPORT_TABBY_RIGHT_PX,
        bottom: VIEWPORT_TABBY_BOTTOM_PX,
        zIndex: VIEWPORT_TABBY_Z_INDEX,
        pointerEvents: "none",
        opacity: gridTabbyHiding ? 0 : 1,
        transition: "opacity 180ms ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: VIEWPORT_TABBY_CONTAINER_SIZE_PX,
          height: VIEWPORT_TABBY_CONTAINER_SIZE_PX,
          transform: `translateY(${gridTabbyFloatUp ? -6 : 2}px)`,
          transition: "transform 2100ms cubic-bezier(0.42, 0, 0.28, 1)",
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: VIEWPORT_TABBY_GLOW_SIZE_PX,
            height: VIEWPORT_TABBY_GLOW_SIZE_PX,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${withAlpha("#FFFFFF", isDarkMode ? (isTabbyTourActive ? 0.3 : 0.24) : isTabbyTourActive ? 0.14 : 0.12)} 0%, ${withAlpha("#FFFFFF", isDarkMode ? (isTabbyTourActive ? 0.16 : 0.12) : isTabbyTourActive ? 0.08 : 0.06)} 42%, transparent 74%)`,
            filter: "blur(1px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: `min(${VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX}px, 100%)`,
          }}
        >
          <TabbySpeechBubble
            theme={THEME}
            isDark={isDarkMode}
            accentColor={TABBY_ASSIST_MINT}
            visible={isGridTabbyTooltipVisible}
            bubbleWidth={gridTabbyBubbleWidth}
            bubbleMaxWidth={gridTabbyBubbleWidth}
            tailSide={gridTabbyBubbleLayout.tailSide}
            pointerEvents={lockedFeatureTooltip || isTabbyTourActive ? "auto" : "none"}
            withAlpha={withAlpha}
            style={{
              position: "absolute",
              ...gridTabbyBubbleLayout.style,
              zIndex: 130,
              transform: `translate(${isGridTabbyTooltipVisible ? 0 : 6}px, ${gridTabbyBubbleLayout.translateY})`,
              transition: "opacity 320ms ease, transform 320ms ease",
              display: "grid",
              gap: 6,
              ...(isTabbyTourActive
                ? {
                    border: `1px solid ${withAlpha(TABBY_ASSIST_MINT, 0.74)}`,
                    background: withAlpha(THEME.surfaceWarm, isDarkMode ? 0.99 : 0.98),
                    boxShadow: `0 18px 42px ${withAlpha("#000000", 0.5)}`,
                    color: withAlpha(THEME.text, 1),
                    padding: "14px 16px",
                  }
                : null),
            }}
          >
            {activeGridTabbyTooltipMode === "tour" ? (
              <span style={{ whiteSpace: "pre-line" }}>Tabby Quick Tour</span>
            ) : activeGridTabbyTooltipMode === "locked" && lockedFeatureTooltip ? (
              <span style={{ whiteSpace: "pre-line" }}>{lockedFeatureTooltip.message}</span>
            ) : activeGridTabbyTooltipMode === "hover" ? (
              <span style={{ display: "grid", gap: 6 }}>
                <span style={{ whiteSpace: "pre-line" }}>Hi! I&apos;m Tabby 👋{"\n\n"}Click me for a quick tour</span>
                <span style={{ fontSize: 11, opacity: 0.62, fontWeight: 600, fontStyle: "italic" }}>(Double-click to hide me)</span>
              </span>
            ) : null}
            {activeGridTabbyTooltipMode === "tour" && (
              <div
                style={{
                  position: "relative",
                  paddingBottom: 40,
                  paddingRight: isFinalTabbyTourStep ? 78 : 0,
                  display: "grid",
                  gap: 6,
                }}
              >
                {isFinalTabbyTourStep ? (
                  <button
                    type="button"
                    onClick={closeTabbyTourToIdle}
                    style={{
                      ...btnSmallPillClose,
                      position: "absolute",
                      top: -2,
                      right: 0,
                      zIndex: 1,
                    }}
                  >
                    Close
                  </button>
                ) : null}
                <span className="tabby-tour-step-indicator">
                  Step {tourStep} of {tabbyTourStepsLength}
                </span>
                <span style={{ whiteSpace: "pre-line" }}>{activeTabbyTourStep?.text || ""}</span>
                {isFinalTabbyTourStep ? (
                  <span
                    style={{
                      fontSize: 11,
                      lineHeight: 1.35,
                      fontWeight: 600,
                      opacity: 0.72,
                      marginTop: 0,
                    }}
                  >
                    Want me out of the way later? You can turn me on or off in Settings.
                  </span>
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "nowrap",
                    marginTop: 0,
                  }}
                >
                  {tourStep > 1 ? (
                    <button
                      type="button"
                      onClick={goToPrevTabbyTourStep}
                      style={{
                        ...btnSecondary,
                        height: 30,
                        padding: "0 12px",
                        minWidth: 64,
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                      }}
                    >
                      Back
                    </button>
                  ) : null}
                  {isFinalTabbyTourStep ? null : (
                    <button
                      type="button"
                      onClick={finishTabbyTour}
                      style={{
                        ...btnSecondary,
                        height: 30,
                        padding: "0 12px",
                        minWidth: 94,
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                      }}
                    >
                      Skip Tour
                    </button>
                  )}
                  {isFinalTabbyTourStep ? (
                    <button
                      className={tabbyTourActionPrimaryClass}
                      type="button"
                      onClick={goToMembershipFromFinalTourStep}
                      style={{
                        minWidth: 0,
                        maxWidth: "100%",
                        padding: "0 12px",
                        whiteSpace: "normal",
                        lineHeight: 1.1,
                        textAlign: "center",
                      }}
                    >
                      See Membership Options
                    </button>
                  ) : (
                    <button
                      className={tabbyTourActionPrimaryClass}
                      type="button"
                      onClick={goToNextTabbyTourStep}
                      style={{ minWidth: 64, whiteSpace: "nowrap", lineHeight: 1 }}
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
            {lockedFeatureTooltip && (
              <button
                className="tabby-upgrade-cta"
                type="button"
                onClick={onBecomeMemberFromLockedTooltip}
                style={{
                  justifySelf: "start",
                }}
              >
                {lockedFeatureTooltip?.cta || "Become a Member"}
              </button>
            )}
          </TabbySpeechBubble>
          <button
            className="tabby-widget-btn"
            type="button"
            onClick={handleGridTabbySingleClick}
            onDoubleClick={handleGridTabbyDoubleClick}
            onMouseEnter={() => {
              setIsHoveringTabby(true);
              if (isTabbyTourActive || lockedFeatureTooltipVisible || blockTabbyHoverTooltip) {
                setTabbyHoverTooltipVisible(false);
                return;
              }
              setTabbyHoverTooltipVisible(true);
            }}
            onMouseLeave={() => {
              setIsHoveringTabby(false);
              setTabbyHoverTooltipVisible(false);
              if (!lockedFeatureTooltipVisible) setBlockTabbyHoverTooltip(false);
            }}
            onBlur={() => {
              setIsHoveringTabby(false);
              setTabbyHoverTooltipVisible(false);
            }}
            aria-label="Open TabStudio walkthrough tutorial"
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            <img
              src={isDarkMode ? tabbyDark : tabbyLight}
              alt="Tabby onboarding helper"
              draggable={false}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                transform: `scaleY(${gridTabbyBlink ? 0.97 : 1})`,
                transition: "transform 120ms ease",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: "none",
              }}
            />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
