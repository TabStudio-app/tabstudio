import React from "react";
import logoLight from "../assets/15.png";
import logoDark from "../assets/16.png";
import { brandLogoButtonClass } from "../utils/uiStyles";

export default function AppHeader({ shared }) {
  const {
    isDark = false,
    logoAriaLabel = "Back to editor",
    onLogoClick,
    rightContent = null,
    showRightGroup = false,
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderRightGroupStyle,
    siteHeaderSloganStyle,
    sloganOpacity = 0.75,
    theme,
  } = shared;

  return (
    <div style={siteHeaderBarStyle(theme)}>
      <div style={siteHeaderLeftGroupStyle}>
        <button
          className={brandLogoButtonClass}
          type="button"
          onClick={onLogoClick}
          aria-label={logoAriaLabel}
          style={siteHeaderLogoButtonStyle}
        >
          <img
            src={isDark ? logoDark : logoLight}
            alt="TabStudio"
            style={siteHeaderLogoImageStyle}
          />
        </button>
        <div style={siteHeaderSloganStyle(theme.text, sloganOpacity)}>
          Tabs, simplified.
        </div>
      </div>
      {showRightGroup ? <div style={siteHeaderRightGroupStyle}>{rightContent}</div> : rightContent}
    </div>
  );
}
