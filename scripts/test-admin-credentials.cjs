const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup({ database = false, readError = false, writeError = false } = {}) {
  const originalPassword = 'Kaavu@admin123';
  let stored = { primaryEmail: 'admin@example.com', emails: ['admin@example.com'], password: originalPassword };
  let row = { email: stored.primaryEmail, password: stored.password };
  const fakeFs = {
    existsSync: file => file.endsWith('.json'),
    readFileSync: () => JSON.stringify(stored),
    writeFileSync: (file, value) => {
      if (writeError) throw new Error('Write failed');
      stored = JSON.parse(value);
    },
  };
  const supabase = { createClient: () => ({ from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: readError ? new Error('Read failed') : null }) }) }),
    upsert: async value => {
      if (writeError) return { error: new Error('Write failed') };
      row = value;
      return { error: null };
    },
  }) }) };
  const exports = {};
  const env = database ? { NEXT_PUBLIC_SUPABASE_URL: 'https://example.com', SUPABASE_SERVICE_ROLE_KEY: 'test-only' } : {};
  const source = ts.transpileModule(fs.readFileSync('lib/admin-credentials.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports, Buffer, console, process: { env, cwd: () => '/test' },
    require: name => name === 'server-only' ? {} : name === 'fs' ? fakeFs : name === '@supabase/supabase-js' ? supabase : require(name),
  });
  return exports;
}

for (const database of [false, true]) {
  test(`password changes reject previous passwords for login and further changes (${database ? 'database' : 'local'})`, async () => {
    const auth = setup({ database });
    const email = 'admin@example.com';
    assert.equal(await auth.verifyAdminCredentials(email, 'Kaavu@admin123'), true);
    assert.equal((await auth.updateAdminCredentials({ currentPassword: 'Kaavu@admin123', newPassword: 'New-password-123' })).success, true);
    assert.equal(await auth.verifyAdminCredentials(email, 'Kaavu@admin123'), false);
    assert.equal(await auth.verifyAdminCredentials(email, 'New-password-123'), true);
    assert.equal(await auth.verifyAdminCredentials('wrong@example.com', 'New-password-123'), false);
    assert.equal((await auth.updateAdminCredentials({ currentPassword: 'Kaavu@admin123', newPassword: 'Unauthorized-123' })).success, false);
    assert.equal((await auth.updateAdminCredentials({ currentPassword: 'New-password-123', newPassword: 'Latest-password-123' })).success, true);
    assert.equal(await auth.verifyAdminCredentials(email, 'New-password-123'), false);
    assert.equal(await auth.verifyAdminCredentials(email, 'Latest-password-123'), true);
  });
  test(`failed credential writes do not report success (${database ? 'database' : 'local'})`, async () => {
    const auth = setup({ database, writeError: true });
    assert.equal((await auth.updateAdminCredentials({ currentPassword: 'Kaavu@admin123', newPassword: 'New-password-123' })).success, false);
    assert.equal(await auth.verifyAdminCredentials('admin@example.com', 'New-password-123'), false);
  });
}
test('database read failures cannot reactivate old local credentials', async () => {
  const auth = setup({ database: true, readError: true });
  await assert.rejects(auth.verifyAdminCredentials('admin@example.com', 'Kaavu@admin123'), /Unable to load admin credentials/);
});
