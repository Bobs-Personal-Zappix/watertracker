No voice-tracker-badge.png was supplied with the original spec, so the badge circle
is currently rendered as a CSS radial-gradient sphere (see voice-tracker-tile.css).

To use a real image instead: drop voice-tracker-badge.png in this folder, then in
voice-tracker-tile.css replace the `background:` line on `.vt-badge` with:

  background-image:url('assets/voice-tracker-badge.png');
  background-size:cover;
  background-position:center;
