// All copy here is original placeholder content for the NOVARA world.
// Replace freely; components read only from this file.

export interface NavItem {
  label: string
  to: string
  caption: string
}

export interface Faction {
  id: string
  code: string
  name: string
  blurb: string
  /** Shader tint for the procedural card art (r, g, b in 0..1). */
  tint: [number, number, number]
  seed: number
}

export const site = {
  name: 'NOVARA',
  tagline: 'Signal from the drift',

  nav: [
    { label: 'Project', to: '/#manifesto', caption: 'What NOVARA is' },
    { label: 'Factions', to: '/#factions', caption: 'Who listens' },
    { label: 'Signal', to: '/#signal', caption: 'The transmission' },
    { label: 'Archive', to: '/archive', caption: 'Recovered logs' },
  ] satisfies NavItem[],

  preloaderLines: [
    '/RELAY/NODE-07/HANDSHAKE',
    '/RELAY/NODE-07/CLOCK_SYNC',
    '/DRIFT/SECTOR-K/DENSITY_MAP',
    '/DRIFT/SECTOR-K/DEBRIS_INDEX',
    '/ARCHIVE/LOGS/FRAGMENT_0119',
    '/ARCHIVE/LOGS/FRAGMENT_0442',
    '/FACTIONS/LANTERN/MANIFEST',
    '/FACTIONS/TIDEWARD/MANIFEST',
    '/FACTIONS/HOLLOWS/MANIFEST',
    '/SIGNAL/CARRIER/LOCK…..21',
    '/SIGNAL/CARRIER/LOCK…..63',
    '/SIGNAL/CARRIER/LOCK…..97',
    'DECODING TRANSMISSION',
  ],

  hero: {
    intro:
      'NOVARA is an open world built in public. A broken relay keeps broadcasting from the edge of the drift, and every listener hears something different.',
    lines: [
      { index: '01S', text: 'SIGNAL.' },
      { index: '02D', text: 'DRIFT.' },
      { index: '03A', text: 'AWAKEN.' },
    ],
  },

  manifesto: {
    eyebrow: '// 01 — The project',
    title: 'A story that is received, not told.',
    body: [
      'Nobody remembers who built the relay. It sits in a field of frozen debris, pulsing once every eleven minutes, and the pulse carries fragments: coordinates, voices, half-finished maps.',
      'NOVARA collects those fragments. Readers decode them, argue about them and extend them. The canon is whatever the community can prove.',
    ],
    stats: [
      { label: 'Fragments recovered', value: '1,204' },
      { label: 'Active listeners', value: '38.6K' },
      { label: 'Pulse interval', value: '11:00' },
    ],
  },

  factions: {
    eyebrow: '// 02 — Factions',
    title: 'Three ways to listen.',
    items: [
      {
        id: 'lantern',
        code: 'F-01',
        name: 'The Lantern Choir',
        blurb: 'Archivists who believe the signal is a memory, and that forgetting it is the only real danger.',
        tint: [1.0, 0.42, 0.18],
        seed: 1.7,
      },
      {
        id: 'tideward',
        code: 'F-02',
        name: 'Tideward',
        blurb: 'Pilots who chase the pulse into the drift, mapping debris one dangerous jump at a time.',
        tint: [0.36, 0.95, 1.0],
        seed: 4.2,
      },
      {
        id: 'hollows',
        code: 'F-03',
        name: 'The Hollows',
        blurb: 'Engineers who think the relay is a lock, and that every fragment is part of a key.',
        tint: [0.82, 1.0, 0.36],
        seed: 8.9,
      },
    ] satisfies Faction[],
  },

  signal: {
    eyebrow: '// 03 — The signal',
    title: 'Pulse 0442, partially decoded.',
    body: 'Press play to watch the raw carrier wave. The noise is the message.',
    video: { src: '/video/signal', title: 'PULSE_0442.RAW', duration: '0:08' },
  },

  outro: {
    title: 'Keep listening.',
    cta: 'Open the archive',
    to: '/archive',
  },

  archive: {
    eyebrow: '// Archive',
    title: 'Recovered logs',
    logs: [
      { id: '0119', date: 'CYCLE 03.112', title: 'First clean pulse', body: 'Eleven seconds of silence, then a tone that does not match any known instrument.' },
      { id: '0207', date: 'CYCLE 03.240', title: 'Coordinates without a map', body: 'A set of numbers that only make sense if the drift is moving backwards.' },
      { id: '0331', date: 'CYCLE 04.018', title: 'The second voice', body: 'Someone answered the relay. The reply was recorded before the question was sent.' },
      { id: '0442', date: 'CYCLE 04.101', title: 'Carrier lock', body: 'All three factions picked up the same fragment at the same time. Nobody agrees on what it says.' },
    ],
  },

  footer: {
    note: 'NOVARA is a placeholder world for a design study. All names, copy, sounds and visuals are original.',
    links: [
      { label: 'Discord', href: '#' },
      { label: 'X / Twitter', href: '#' },
      { label: 'Press kit', href: '#' },
    ],
  },
}
