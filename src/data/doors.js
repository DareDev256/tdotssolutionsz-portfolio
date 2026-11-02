/**
 * The two booking doors (moved out of BookDoors.jsx in 6.19.0, unchanged, so the build can quote the
 * same offers in the no-JS copy of index.html; see vite.config.js).
 */
/* the door lands in the tdots inbox — James's call, 2026-09-20 */
export const DOORS_TO = 'tdotssolutionsz@gmail.com'

export const DOORS = [
  {
    id: 'video',
    pill: 'A music video',
    title: 'A music video',
    lines: [
      'Send the record and the idea.',
      'You get a treatment back, a shoot day with a crew, the edit and colour, and the cut delivered for YouTube with verticals for the feed.',
    ],
    subject: 'Music video',
    body: 'Hi James,\n\nI want a music video.\n\nThe record: \nThe idea: \nWhen: \n\n',
  },
  {
    id: 'site',
    pill: 'A website',
    title: 'A website',
    lines: [
      'Built from what you already post.',
      '$500 to build, half at preview and half at live. $30 a month keeps it up, with the domain and edits. Live in a week.',
    ],
    href: '/sites/',
    subject: 'Website',
    body: 'Hi James,\n\nI want a site.\n\nMy Instagram: @\nWhat I do: \n\n',
  },
]
