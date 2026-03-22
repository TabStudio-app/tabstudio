import React from "react";
export default function AboutPage({ shared }) {
  const { aboutRef, HELP_THEME, sectionStyle } = shared;

  return (
    <section id="about" ref={aboutRef} style={sectionStyle("about")}>
      <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>About TabStudio</h2>
      <div style={{ color: HELP_THEME.textFaint, lineHeight: 1.65, fontSize: 18 }}>
        <p>TabStudio is a clean, focused tool for writing guitar tabs.</p>
        <p>
          Traditional tab software can often feel slow, cluttered, and overly complicated. TabStudio was created to simplify
          the process, making it easy to capture ideas, organise songs, and export clear tab sheets without getting lost in
          unnecessary features.
        </p>
        <p>
          Whether you're writing quick riffs at home, structuring full songs with a band, creating lesson material for
          students, or exporting tab images and chord diagrams for content creators, TabStudio helps keep your ideas organised
          and easy to share.
        </p>
        <p>The goal is simple:</p>
        <p style={{ margin: 0 }}>
          • Write tabs quickly
          <br />
          • Organise songs clearly
          <br />
          • Export clean, readable tab sheets as PDF or PNG images
        </p>
        <p>Tabs, simplified.</p>
      </div>
    </section>
  );
}
