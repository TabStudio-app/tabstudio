import React from "react";
import AccountProfilePhotoEditor from "./AccountProfilePhotoEditor";
import { AccountCard, AccountLabel } from "./AccountSectionPrimitives";

export default function AccountProfileSection({ shared, data, actions }) {
  const { field, profileDisplayName, setAccountAvatarDataUrl, setProfileDisplayName } = shared;

  return (
    <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
      <AccountCard shared={shared}>
        <div style={{ display: "grid", gap: 12 }}>
          <AccountProfilePhotoEditor
            accountAvatarDataUrl={data.identity.avatarDataUrl}
            accountFullName={data.profile.displayName || data.identity.fullName}
            btnSmallPill={shared.btnSmallPill}
            btnSmallPillDanger={shared.btnSmallPillDanger}
            card={shared.card}
            onAvatarChange={setAccountAvatarDataUrl}
            THEME={shared.THEME}
            withAlpha={shared.withAlpha}
          />

          <div>
            <AccountLabel shared={shared}>Display name</AccountLabel>
            <input value={profileDisplayName} onChange={(e) => setProfileDisplayName(e.target.value)} style={{ ...field }} placeholder="Display name" />
          </div>
        </div>
      </AccountCard>
    </div>
  );
}
