import React, { useRef, useState } from "react";

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AccountProfilePhotoEditor({
  accountAvatarDataUrl,
  accountFullName,
  btnSmallPill,
  btnSmallPillDanger,
  card,
  onAvatarChange,
  THEME,
  withAlpha,
}) {
  const fileInputRef = useRef(null);
  const [photoError, setPhotoError] = useState("");

  const avatarFallback = String(accountFullName || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const applySelectedFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_PROFILE_PHOTO_TYPES.includes(String(file.type || "").toLowerCase())) {
      setPhotoError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (Number(file.size || 0) > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoError("Please choose an image smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onAvatarChange?.(String(reader.result || ""));
      setPhotoError("");
    };
    reader.onerror = () => {
      setPhotoError("We couldn't read that image. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ ...card, borderRadius: 12, padding: 12, background: THEME.surfaceWarm }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Profile Photo</div>
      <div style={{ fontSize: 13, color: THEME.textFaint, lineHeight: 1.5 }}>
        Upload a profile image for your TabStudio account.
      </div>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            border: `1px solid ${THEME.border}`,
            background: THEME.surface,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: THEME.textFaint,
            fontSize: 20,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {accountAvatarDataUrl ? (
            <img src={accountAvatarDataUrl} alt="Profile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            avatarFallback || "?"
          )}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...btnSmallPill }}>
              Upload Photo
            </button>
            {accountAvatarDataUrl ? (
              <button
                type="button"
                onClick={() => {
                  onAvatarChange?.("");
                  setPhotoError("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{ ...btnSmallPillDanger }}
              >
                Remove Photo
              </button>
            ) : null}
          </div>
          <div style={{ fontSize: 12, color: withAlpha(THEME.text, 0.55), lineHeight: 1.45 }}>
            JPG, PNG, or WebP. Up to 5MB.
          </div>
          {photoError ? <div style={{ fontSize: 12, color: "#FF6E7A", fontWeight: 800 }}>{photoError}</div> : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(event) => applySelectedFile(event.target.files?.[0])}
      />
    </div>
  );
}
