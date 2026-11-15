const P = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  book: 'M12 6c-2-1.5-5-2-8-2v15c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v15',
  pen: 'M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z',
  folder: 'M3 6h6l2 2h10v11H3z',
  cap: 'M2 9l10-5 10 5-10 5L2 9zM6 11.5V16c2 2 10 2 12 0v-4.5',
  clipboard: 'M8 4h8v3H8zM6 5H5v16h14V5h-1M9 12h6M9 16h6',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 010 6.5M18 14c2.5.6 4 2.6 4 6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.5-7 8-7s8 3 8 7',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevron: 'M9 5l7 7-7 7',
  back: 'M15 5l-7 7 7 7',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  plus: 'M12 5v14M5 12h14',
  menu: 'M4 6h16M4 12h16M4 18h16',
  x: 'M6 6l12 12M18 6L6 18',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  thumb: 'M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.5 2.5V10H19a2 2 0 012 2.3l-1 6a2 2 0 01-2 1.7H7',
  chat: 'M4 5h16v11H9l-5 4z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  alert: 'M12 4l9 16H3zM12 10v5M12 17.5v.5',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}
