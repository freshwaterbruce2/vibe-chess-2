import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();

test('Simplified Single-Player HUD in src/App.tsx excludes speed sliders, notation script bar, and multiplayer lobby', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');

  // Must include simplified game & camera controls
  for (const requiredId of [
    'btn-side-toggle',
    'btn-ai-move',
    'btn-reset',
    'btn-cam-player',
    'btn-cam-top',
    'btn-cam-side',
    'btn-cam-wide',
    'btn-hide-ui',
    'controls-hint',
    'captured-tray'
  ]) {
    assert.ok(appTsx.includes(`id="${requiredId}"`), `Missing required HUD control #${requiredId}`);
  }

  // Must NOT include camera speed sliders, script mode bar, or multiplayer lobby
  for (const forbiddenId of [
    'cam-speed-wrap',
    'input-cam-speed',
    'rot-speed-wrap',
    'input-rot-speed',
    'script-bar',
    'btn-script-modal',
    'btn-script-prev',
    'btn-script-next',
    'btn-lobby',
    'lobby-modal',
    'room-pill',
    'btn-checkmate-stepback'
  ]) {
    assert.ok(!appTsx.includes(forbiddenId), `Forbidden UI element #${forbiddenId} found in App.tsx`);
  }
});

test('All 7 compressed 3D assets (.glb.gz.b64) decode and gunzip to valid glTF 2.0 binary models', () => {
  const expectedModels = [
    'option8_cathedral',
    'pawn_white',
    'rook_white',
    'knight_white',
    'bishop_white',
    'queen_white',
    'king_white'
  ];

  for (const name of expectedModels) {
    const b64Path = path.join(ROOT, 'public/assets/glb', `${name}.glb.gz.b64`);
    assert.ok(fs.existsSync(b64Path), `Missing 3D asset ${b64Path}`);
    const b64Text = fs.readFileSync(b64Path, 'utf-8').trim();
    assert.ok(b64Text.length > 1000, `Asset ${name}.glb.gz.b64 is unexpectedly small`);

    const gzBuf = Buffer.from(b64Text, 'base64');
    const glbBuf = zlib.gunzipSync(gzBuf);

    const magic = glbBuf.toString('ascii', 0, 4);
    const version = glbBuf.readUInt32LE(4);
    const totalLen = glbBuf.readUInt32LE(8);
    assert.equal(magic, 'glTF', `Invalid glTF magic header for ${name}`);
    assert.equal(version, 2, `Invalid glTF version for ${name}`);
    assert.equal(totalLen, glbBuf.length, `Mismatched glTF byte length for ${name}`);
  }
});

test('Lessons and Puzzle Coach dataset contains all required starter lessons and mate puzzles', () => {
  const fileContent = fs.readFileSync(path.join(ROOT, 'src/lessonsAndPuzzles.ts'), 'utf-8');
  assert.ok(fileContent.includes('LESSONS'), 'Missing LESSONS export');
  assert.ok(fileContent.includes('PUZZLES'), 'Missing PUZZLES export');

  // Must include starter lessons
  assert.ok(fileContent.includes('pawn-movement'), 'Missing pawn lesson');
  assert.ok(fileContent.includes('knight-jump'), 'Missing knight lesson');
  assert.ok(fileContent.includes('bishop-diagonals'), 'Missing bishop lesson');
  assert.ok(fileContent.includes('castling-shield'), 'Missing castling lesson');
  assert.ok(fileContent.includes('check-vs-checkmate'), 'Missing check vs checkmate lesson');

  // Must include tactical puzzles with solutions
  assert.ok(fileContent.includes('puzzle-scholars-mate'), 'Missing scholars mate puzzle');
  assert.ok(fileContent.includes('puzzle-back-rank'), 'Missing back rank puzzle');
  assert.ok(fileContent.includes('puzzle-smothered'), 'Missing smothered mate puzzle');
  assert.ok(fileContent.includes('puzzle-anastasia-2'), 'Missing anastasia mate-in-2 puzzle');
});

test('App.tsx contains settings and helpers for Chess Master requirements', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');

  // Check for AI difficulty options
  assert.ok(appTsx.includes("'easy'"), 'Missing easy AI difficulty');
  assert.ok(appTsx.includes("'medium'"), 'Missing medium AI difficulty');
  assert.ok(appTsx.includes("'hard'"), 'Missing hard AI difficulty');
  assert.ok(appTsx.includes("'expert'"), 'Missing expert AI difficulty');

  // Check for Capture animations options
  assert.ok(appTsx.includes("'full'"), 'Missing full capture anim');
  assert.ok(appTsx.includes("'quick'"), 'Missing quick capture anim');
  assert.ok(appTsx.includes("'off'"), 'Missing off capture anim');

  // Check for Graphics setting
  assert.ok(appTsx.includes("'high'"), 'Missing high graphics setting');
  assert.ok(appTsx.includes("'low'"), 'Missing low graphics setting');

  // Check for learning helpers
  assert.ok(appTsx.includes('handleUndo'), 'Missing undo handler');
  assert.ok(appTsx.includes('handleHint'), 'Missing hint handler');
  assert.ok(appTsx.includes('handleToggle2D'), 'Missing 2D top-down toggle handler');
  assert.ok(appTsx.includes('handleResetCamera'), 'Missing reset camera handler');
});
