// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import icon from "astro-icon";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.fancy-mumble.com",
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    icon({
      include: {
        // Lucide is the same icon family the client uses for generic
        // UI icons (mic, paperclip, etc.). Reference any of them via
        // `<Icon name="lucide:mic" />`.
        lucide: ["*"],
        // Simple Icons gives us real brand logos (Windows, Linux,
        // Android, Apple, Ubuntu, Fedora, Debian, Docker, GitHub...).
        // Reference via `<Icon name="simple-icons:windows" />`.
        // Pre-listed so the bundle stays small.
        "simple-icons": [
          "windows",
          "linux",
          "android",
          "apple",
          "ubuntu",
          "debian",
          "fedora",
          "opensuse",
          "archlinux",
          "docker",
          "github",
          "firefox",
          "googlechrome",
          "appimage",
        ],
      },
    }),
    starlight({
      title: "Fancy Mumble",
      description:
        "Documentation for the Fancy Mumble app, server, and Docker image. Voice chat reimagined for 2026.",
      logo: {
        src: "./src/assets/logo.svg",
        replacesTitle: false,
      },
      favicon: "/favicon.svg",
      social: [
        {
          icon: "external",
          label: "fancy-mumble.com",
          href: "https://fancy-mumble.com/",
        },
        {
          icon: "github",
          label: "GitHub (App)",
          href: "https://github.com/Fancy-Mumble/FancyMumbleNext",
        },
        {
          icon: "github",
          label: "GitHub (Server)",
          href: "https://github.com/Fancy-Mumble/mumble-server",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/Fancy-Mumble/docs/edit/main/",
      },
      lastUpdated: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      customCss: ["./src/styles/custom.css"],
      head: [
        {
          tag: "meta",
          attrs: { name: "theme-color", content: "#7e57c2" },
        },
        {
          // Move the astro-icon SVG from each .platform-heading into the
          // corresponding tab button so the icon appears in the tablist
          // next to the label instead of as a heading below the tabs.
          //
          // .platform-heading is hidden via CSS; this script clones the
          // SVG into the tab anchor so it shows up in the clickable
          // tab header. We clone (not move) so that inactive tab panels
          // (which may still be in the DOM but hidden) don't lose their
          // SVG when Starlight's web component initialises.
          tag: "script",
          content: `
(function injectPlatformIcons() {
  function inject() {
    document.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
      var h = panel.querySelector('.platform-heading');
      if (!h) return;
      var labelId = panel.getAttribute('aria-labelledby');
      if (!labelId) return;
      var tab = document.getElementById(labelId);
      if (!tab) return;
      // Skip if we already injected an icon for this tab.
      if (tab.querySelector('svg')) return;
      var svg = h.querySelector('svg');
      if (!svg) return;
      var clone = svg.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('focusable', 'false');
      tab.insertBefore(clone, tab.firstChild);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
  // Also run after Starlight's custom element upgrades (deferred module
  // scripts run before DOMContentLoaded, but just in case).
  if (typeof customElements !== 'undefined' && customElements.whenDefined) {
    customElements.whenDefined('starlight-tabs').then(inject).catch(function(){});
  }
})();
`,
        },
      ],
      sidebar: [
        {
          label: "Welcome",
          items: [
            { label: "What is Fancy Mumble?", link: "/welcome/intro/" },
            { label: "Quick tour of the UI", link: "/welcome/tour/" },
            { label: "Glossary", link: "/welcome/glossary/" },
          ],
        },
        {
          label: "Getting Started",
          badge: { text: "Users", variant: "tip" },
          items: [
            { label: "Install Fancy Mumble", link: "/getting-started/install/" },
            { label: "Connect to a server", link: "/getting-started/connect/" },
            { label: "First voice call", link: "/getting-started/first-call/" },
            { label: "Mobile (Android)", link: "/getting-started/android/" },
          ],
        },
        {
          label: "For Users",
          badge: { text: "Users", variant: "tip" },
          items: [
            { label: "Profile customization", link: "/users/profile/" },
            { label: "Audio configuration", link: "/users/audio/" },
            { label: "Screen sharing", link: "/users/screen-sharing/" },
            { label: "Files & images", link: "/users/file-sharing/" },
            { label: "Chat features", link: "/users/chat/" },
            { label: "Live document editor", link: "/users/live-doc/" },
            { label: "Notifications", link: "/users/notifications/" },
            { label: "Personalization & themes", link: "/users/personalization/" },
            { label: "Keyboard shortcuts", link: "/users/shortcuts/" },
            { label: "Privacy & identities", link: "/users/privacy/" },
          ],
        },
        {
          label: "Server Owners",
          badge: { text: "Ops", variant: "note" },
          items: [
            { label: "Docker quick start", link: "/server/docker/" },
            { label: "Setup wizard", link: "/server/wizard/" },
            { label: "Configuration reference", link: "/server/config/" },
            { label: "Ports & networking", link: "/server/network/" },
            {
              label: "Feature deep-dives",
              collapsed: false,
              items: [
                { label: "Persistent chat", link: "/server/features/persistent-chat/" },
                { label: "Push notifications", link: "/server/features/push/" },
                { label: "Screen sharing relay", link: "/server/features/webrtc-sfu/" },
                { label: "File server", link: "/server/features/file-server/" },
                { label: "Link previews", link: "/server/features/link-previews/" },
                { label: "Reactions & polls", link: "/server/features/reactions/" },
                { label: "Watch Together", link: "/server/features/watch-together/" },
                { label: "Whiteboard", link: "/server/features/whiteboard/" },
                { label: "Live documents", link: "/server/features/live-doc/" },
              ],
            },
            {
              label: "Plugins",
              collapsed: false,
              items: [
                { label: "Plugin system overview", link: "/server/plugins/overview/" },
                { label: "Using plugins", link: "/server/plugins/using/" },
                { label: "Developing a plugin", link: "/server/plugins/developing/" },
              ],
            },
            { label: "Customize & disable features", link: "/server/customize/" },
            { label: "Building from source", link: "/server/build/" },
            { label: "Upgrade & backup", link: "/server/upgrade/" },
          ],
        },
        {
          label: "Server Admins",
          badge: { text: "Admin", variant: "caution" },
          items: [
            { label: "SuperUser & first login", link: "/admin/superuser/" },
            { label: "Channels", link: "/admin/channels/" },
            { label: "Registered users", link: "/admin/users/" },
            { label: "Roles & permissions", link: "/admin/roles/" },
            { label: "Channel ACL", link: "/admin/acl/" },
            { label: "Groups", link: "/admin/groups/" },
            { label: "Ban list", link: "/admin/bans/" },
            { label: "Custom emotes", link: "/admin/emotes/" },
            { label: "Onboarding workflow", link: "/admin/onboarding/" },
          ],
        },
        {
          label: "Troubleshooting",
          badge: { text: "Help", variant: "danger" },
          items: [
            { label: "Common issues", link: "/troubleshooting/common-issues/" },
            { label: "Audio problems", link: "/troubleshooting/audio/" },
            { label: "Connection problems", link: "/troubleshooting/connection/" },
            { label: "Screen-share problems", link: "/troubleshooting/screen-share/" },
            { label: "Debug logging", link: "/troubleshooting/debug-logging/" },
            { label: "Reporting bugs", link: "/troubleshooting/reporting-bugs/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Server config keys", link: "/reference/config-keys/" },
            { label: "Permission flags", link: "/reference/permissions/" },
            { label: "Ports & protocols", link: "/reference/ports/" },
            { label: "Keyboard shortcuts", link: "/reference/keymap/" },
          ],
        },
      ],
    }),
  ],
});
