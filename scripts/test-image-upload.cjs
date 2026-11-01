const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

function setup(width, height) {
  const exports = {};
  const drawn = [];
  const source = stripTypeScriptTypes(fs.readFileSync('lib/productImageUpload.ts', 'utf8'))
    .replace(/^import .*;$/gm, '')
    .replace(/export (async function|function|class|const) /g, '$1 ')
    + '\nObject.assign(exports, { inspectImageUpload, prepareProductImage, prepareSlotImage });';
  vm.runInNewContext(source, {
    exports, require: () => ({}),
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    window: { Image: class {
      naturalWidth = width; naturalHeight = height;
      set src(value) { this.onload(); }
    } },
    document: { createElement: () => ({
      getContext: () => ({ drawImage: (...args) => drawn.push(args.slice(3)) }),
      toBlob: callback => callback({ type: 'image/webp', size: 100 }),
    }) },
  });
  return { ...exports, drawn };
}
const file = { name: 'photo.jpg', type: 'image/jpeg', size: 500_000 };
for (const [width, height] of [[1086, 1448], [1024, 1536], [4160, 6240], [1600, 500], [1, 1]]) {
  test(`accepts ${width}x${height}, preserves proportions and does not upscale`, async () => {
    const auth = setup(width, height);
    assert.equal((await auth.inspectImageUpload(file, 'product')).length, 0);
    await auth.prepareProductImage(file);
    await auth.prepareSlotImage(file, 'instagram');
    for (const [w, h] of auth.drawn) {
      assert.ok(w <= width && h <= height);
      assert.ok(Math.abs(w / h - width / height) < 0.02);
    }
  });
}
test('files above 1 MB remain rejected', async () => {
  const auth = setup(1086, 1448);
  const large = { ...file, size: 1_000_001 };
  assert.match((await auth.inspectImageUpload(large, 'product'))[0], /1 MB maximum/);
  await assert.rejects(auth.prepareProductImage(large), /1 MB maximum/);
});
test('non-image files remain rejected', async () => {
  const auth = setup(1086, 1448);
  assert.match((await auth.inspectImageUpload({ ...file, type: 'text/plain' }, 'product'))[0], /Choose an image/);
});
