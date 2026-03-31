// Keyboard layout definitions.
// rows: 4 rows of key labels (number row → top → home → bottom).
// rowStagger: left padding (px) per row.
// isoExtraKey: if set, rendered between left shift and the first key of the bottom row.
// physicalToLogical: maps one physical key label to the logical chars it produces
//   (used by the progress heatmap to determine whether a key is learned/struggling).

export const LAYOUTS = {
  us: {
    id: 'us',
    rows: [
      ['1','2','3','4','5','6','7','8','9','0'],
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l',';',"'"],
      ['z','x','c','v','b','n','m',',','.','/'],
    ],
    rowStagger: [0, 22, 36, 0],
    isoExtraKey: null,
    physicalToLogical: {
      ';':       [';', ':'],
      "'":       ["'", '"'],
      '/':       ['?'],
      '1':       ['!'],
      'shift_l': ['shift'],
      'shift_r': ['shift'],
    },
  },

  nl: {
    id: 'nl',
    rows: [
      ['1','2','3','4','5','6','7','8','9','0'],
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l',';',"'"],
      ['z','x','c','v','b','n','m',',','.','/'],
    ],
    rowStagger: [0, 22, 36, 0],
    isoExtraKey: '`',   // ISO extra key between left shift and Z
    physicalToLogical: {
      ';':       [';', ':'],
      "'":       ["'", '"'],
      '/':       ['?'],
      '1':       ['!'],
      'shift_l': ['shift'],
      'shift_r': ['shift'],
      '`':       [],    // extra key — not taught
    },
  },
}
