export type KeyDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h?: number;
};

export const KEYBOARD_UNIT = 58;
export const KEY_GAP = 7;

/** Full-size ANSI 104-key layout in unit coordinates */
export const KEYBOARD_LAYOUT: KeyDef[] = [
  // Function row
  { id: "Esc", label: "Esc", x: 0, y: 0, w: 1 },
  { id: "F1", label: "F1", x: 2, y: 0, w: 1 },
  { id: "F2", label: "F2", x: 3, y: 0, w: 1 },
  { id: "F3", label: "F3", x: 4, y: 0, w: 1 },
  { id: "F4", label: "F4", x: 5, y: 0, w: 1 },
  { id: "F5", label: "F5", x: 6.5, y: 0, w: 1 },
  { id: "F6", label: "F6", x: 7.5, y: 0, w: 1 },
  { id: "F7", label: "F7", x: 8.5, y: 0, w: 1 },
  { id: "F8", label: "F8", x: 9.5, y: 0, w: 1 },
  { id: "F9", label: "F9", x: 11, y: 0, w: 1 },
  { id: "F10", label: "F10", x: 12, y: 0, w: 1 },
  { id: "F11", label: "F11", x: 13, y: 0, w: 1 },
  { id: "F12", label: "F12", x: 14, y: 0, w: 1 },
  { id: "PrintScreen", label: "PrtSc", x: 15.25, y: 0, w: 1 },
  { id: "ScrollLock", label: "ScrLk", x: 16.25, y: 0, w: 1 },
  { id: "Pause", label: "Pause", x: 17.25, y: 0, w: 1 },

  // Number row
  { id: "`", label: "`", x: 0, y: 1.25, w: 1 },
  { id: "1", label: "1", x: 1, y: 1.25, w: 1 },
  { id: "2", label: "2", x: 2, y: 1.25, w: 1 },
  { id: "3", label: "3", x: 3, y: 1.25, w: 1 },
  { id: "4", label: "4", x: 4, y: 1.25, w: 1 },
  { id: "5", label: "5", x: 5, y: 1.25, w: 1 },
  { id: "6", label: "6", x: 6, y: 1.25, w: 1 },
  { id: "7", label: "7", x: 7, y: 1.25, w: 1 },
  { id: "8", label: "8", x: 8, y: 1.25, w: 1 },
  { id: "9", label: "9", x: 9, y: 1.25, w: 1 },
  { id: "0", label: "0", x: 10, y: 1.25, w: 1 },
  { id: "-", label: "-", x: 11, y: 1.25, w: 1 },
  { id: "=", label: "=", x: 12, y: 1.25, w: 1 },
  { id: "Backspace", label: "Backspace", x: 13, y: 1.25, w: 2 },
  { id: "Insert", label: "Ins", x: 15.25, y: 1.25, w: 1 },
  { id: "Home", label: "Home", x: 16.25, y: 1.25, w: 1 },
  { id: "PageUp", label: "PgUp", x: 17.25, y: 1.25, w: 1 },
  { id: "NumLock", label: "Num", x: 18.5, y: 1.25, w: 1 },
  { id: "Num/", label: "/", x: 19.5, y: 1.25, w: 1 },
  { id: "Num*", label: "*", x: 20.5, y: 1.25, w: 1 },
  { id: "Num-", label: "-", x: 21.5, y: 1.25, w: 1 },

  // Q row
  { id: "Tab", label: "Tab", x: 0, y: 2.25, w: 1.5 },
  { id: "Q", label: "Q", x: 1.5, y: 2.25, w: 1 },
  { id: "W", label: "W", x: 2.5, y: 2.25, w: 1 },
  { id: "E", label: "E", x: 3.5, y: 2.25, w: 1 },
  { id: "R", label: "R", x: 4.5, y: 2.25, w: 1 },
  { id: "T", label: "T", x: 5.5, y: 2.25, w: 1 },
  { id: "Y", label: "Y", x: 6.5, y: 2.25, w: 1 },
  { id: "U", label: "U", x: 7.5, y: 2.25, w: 1 },
  { id: "I", label: "I", x: 8.5, y: 2.25, w: 1 },
  { id: "O", label: "O", x: 9.5, y: 2.25, w: 1 },
  { id: "P", label: "P", x: 10.5, y: 2.25, w: 1 },
  { id: "[", label: "[", x: 11.5, y: 2.25, w: 1 },
  { id: "]", label: "]", x: 12.5, y: 2.25, w: 1 },
  { id: "\\", label: "\\", x: 13.5, y: 2.25, w: 1.5 },
  { id: "Delete", label: "Del", x: 15.25, y: 2.25, w: 1 },
  { id: "End", label: "End", x: 16.25, y: 2.25, w: 1 },
  { id: "PageDown", label: "PgDn", x: 17.25, y: 2.25, w: 1 },
  { id: "Num7", label: "7", x: 18.5, y: 2.25, w: 1 },
  { id: "Num8", label: "8", x: 19.5, y: 2.25, w: 1 },
  { id: "Num9", label: "9", x: 20.5, y: 2.25, w: 1 },
  { id: "Num+", label: "+", x: 21.5, y: 2.25, w: 1, h: 2 },

  // A row
  { id: "CapsLock", label: "Caps", x: 0, y: 3.25, w: 1.75 },
  { id: "A", label: "A", x: 1.75, y: 3.25, w: 1 },
  { id: "S", label: "S", x: 2.75, y: 3.25, w: 1 },
  { id: "D", label: "D", x: 3.75, y: 3.25, w: 1 },
  { id: "F", label: "F", x: 4.75, y: 3.25, w: 1 },
  { id: "G", label: "G", x: 5.75, y: 3.25, w: 1 },
  { id: "H", label: "H", x: 6.75, y: 3.25, w: 1 },
  { id: "J", label: "J", x: 7.75, y: 3.25, w: 1 },
  { id: "K", label: "K", x: 8.75, y: 3.25, w: 1 },
  { id: "L", label: "L", x: 9.75, y: 3.25, w: 1 },
  { id: ";", label: ";", x: 10.75, y: 3.25, w: 1 },
  { id: "'", label: "'", x: 11.75, y: 3.25, w: 1 },
  { id: "Return", label: "Enter", x: 12.75, y: 3.25, w: 2.25 },
  { id: "Num4", label: "4", x: 18.5, y: 3.25, w: 1 },
  { id: "Num5", label: "5", x: 19.5, y: 3.25, w: 1 },
  { id: "Num6", label: "6", x: 20.5, y: 3.25, w: 1 },

  // Z row
  { id: "Shift", label: "Shift", x: 0, y: 4.25, w: 2.25 },
  { id: "Z", label: "Z", x: 2.25, y: 4.25, w: 1 },
  { id: "X", label: "X", x: 3.25, y: 4.25, w: 1 },
  { id: "C", label: "C", x: 4.25, y: 4.25, w: 1 },
  { id: "V", label: "V", x: 5.25, y: 4.25, w: 1 },
  { id: "B", label: "B", x: 6.25, y: 4.25, w: 1 },
  { id: "N", label: "N", x: 7.25, y: 4.25, w: 1 },
  { id: "M", label: "M", x: 8.25, y: 4.25, w: 1 },
  { id: ",", label: ",", x: 9.25, y: 4.25, w: 1 },
  { id: ".", label: ".", x: 10.25, y: 4.25, w: 1 },
  { id: "/", label: "/", x: 11.25, y: 4.25, w: 1 },
  { id: "RShift", label: "Shift", x: 12.25, y: 4.25, w: 2.75 },
  { id: "Up", label: "↑", x: 16.25, y: 4.25, w: 1 },
  { id: "Num1", label: "1", x: 18.5, y: 4.25, w: 1 },
  { id: "Num2", label: "2", x: 19.5, y: 4.25, w: 1 },
  { id: "Num3", label: "3", x: 20.5, y: 4.25, w: 1 },
  { id: "NumEnter", label: "Enter", x: 21.5, y: 4.25, w: 1, h: 2 },

  // Bottom row
  { id: "LCtrl", label: "Ctrl", x: 0, y: 5.25, w: 1.25 },
  { id: "LWin", label: "Win", x: 1.25, y: 5.25, w: 1.25 },
  { id: "LAlt", label: "Alt", x: 2.5, y: 5.25, w: 1.25 },
  { id: "Space", label: "Space", x: 3.75, y: 5.25, w: 6.25 },
  { id: "RAlt", label: "Alt", x: 10, y: 5.25, w: 1.25 },
  { id: "RWin", label: "Win", x: 11.25, y: 5.25, w: 1.25 },
  { id: "Apps", label: "Menu", x: 12.5, y: 5.25, w: 1.25 },
  { id: "RCtrl", label: "Ctrl", x: 13.75, y: 5.25, w: 1.25 },
  { id: "Left", label: "←", x: 15.25, y: 5.25, w: 1 },
  { id: "Down", label: "↓", x: 16.25, y: 5.25, w: 1 },
  { id: "Right", label: "→", x: 17.25, y: 5.25, w: 1 },
  { id: "Num0", label: "0", x: 18.5, y: 5.25, w: 2 },
  { id: "Num.", label: ".", x: 20.5, y: 5.25, w: 1 },
];

export const KEYBOARD_WIDTH_U = 22.5;
export const KEYBOARD_HEIGHT_U = 6.25;

/** Map a normalized KeyStats count to one physical layout key. */
export function resolveKeyCount(
  keyId: string,
  counts: Record<string, number>
): number {
  const sum = (...keys: string[]) =>
    keys.reduce((total, key) => total + (counts[key] ?? 0), 0);

  switch (keyId) {
    case "Shift":
      return sum("LShift", "Shift");
    case "RShift":
      return sum("RShift");
    case "LCtrl":
      return sum("LCtrl", "Ctrl");
    case "RCtrl":
      return sum("RCtrl");
    case "LAlt":
      return sum("LAlt", "Option", "Alt");
    case "RAlt":
      return sum("RAlt");
    case "LWin":
      return sum("LWin", "Cmd", "Win");
    case "RWin":
      return sum("RWin");
    case "Return":
      return sum("Return", "Enter");
    case "Apps":
      return sum("Apps", "Menu");
    default:
      return counts[keyId] ?? 0;
  }
}
