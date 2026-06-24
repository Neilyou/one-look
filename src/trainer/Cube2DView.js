import React, { useMemo } from 'react';
import { MOVE_FUNCTIONS } from '../util/stickerMapper';

const COLOR_MAP = {
  w: '#f8fafc', y: '#facc15', g: '#22c55e',
  b: '#3b82f6', o: '#f97316', r: '#ef4444'
};

const FACE_IDX = {
  U: [0, 1, 2, 3],
  D: [4, 5, 6, 7],
  F: [8, 9, 10, 11],
  B: [12, 13, 14, 15],
  L: [16, 17, 18, 19],
  R: [20, 21, 22, 23]
};

function buildStateFromScramble(scramble = '') {
  let stickers = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14, 15],
    [16, 17, 18, 19],
    [20, 21, 22, 23]
  ];

  const moves = scramble.trim() ? scramble.trim().split(/\s+/) : [];
  moves.forEach((move) => {
    const fn = MOVE_FUNCTIONS[move];
    if (!fn) return;
    stickers = stickers.map((arr) => arr.map((idx) => fn(idx)));
  });

  const state = Array(24);
  stickers[0].forEach((i) => (state[i] = 'w'));
  stickers[1].forEach((i) => (state[i] = 'y'));
  stickers[2].forEach((i) => (state[i] = 'g'));
  stickers[3].forEach((i) => (state[i] = 'b'));
  stickers[4].forEach((i) => (state[i] = 'o'));
  stickers[5].forEach((i) => (state[i] = 'r'));
  return state;
}

function Face({ title, values }) {
  return (
    <div className={`face-card face-${title}`}>
      <div className="face-title">{title}</div>
      <div className="face-grid">
        {values.map((v, i) => (
          <div
            key={`${title}-${i}`}
            className="sticker"
            style={{ background: COLOR_MAP[v] || '#334155' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Cube2DView({ scramble }) {
  const state = useMemo(() => buildStateFromScramble(scramble), [scramble]);

  const faces = {
    U: FACE_IDX.U.map((i) => state[i]),
    D: FACE_IDX.D.map((i) => state[i]),
    F: FACE_IDX.F.map((i) => state[i]),
    B: FACE_IDX.B.map((i) => state[i]),
    L: FACE_IDX.L.map((i) => state[i]),
    R: FACE_IDX.R.map((i) => state[i]),
  };

  return (
    <div className="cube2d-wrap">
      {['U', 'D', 'F', 'B', 'L', 'R'].map((name) => (
        <Face key={name} title={name} values={faces[name]} />
      ))}
    </div>
  );
}