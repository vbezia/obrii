import test from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import defaults from '../content/site.json' with { type: 'json' };
import { validateContent, validateMedia } from '../lib/admin/validation.ts';
import {
  makeSession,
  validSession,
  sameOrigin,
  checkPassword,
} from '../lib/admin/auth.ts';
import { readContent, publishContent } from '../lib/admin/github.ts';

const salt = 'a'.repeat(32),
  password = 'test-password-with-sufficient-entropy';
process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
process.env.ADMIN_SESSION_SECRET = 'test-session-secret-'.repeat(4);
await test('sessions reject tampering, expiration and missing configuration', () => {
  const now = Date.now(),
    session = makeSession(now);
  assert.equal(validSession(session, now), true);
  assert.equal(
    validSession(
      session.slice(0, -1) + (session.endsWith('0') ? '1' : '0'),
      now,
    ),
    false,
  );
  assert.equal(validSession(session, now + 9 * 3600000), false);
  assert.equal(validSession('garbage', now), false);
  const secret = process.env.ADMIN_SESSION_SECRET;
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal(validSession(session, now), false);
  assert.throws(() => makeSession());
  process.env.ADMIN_SESSION_SECRET = secret;
});
await test('password is checked using stored scrypt hash', async () => {
  assert.equal(await checkPassword(password), true);
  assert.equal(await checkPassword('wrong-password'), false);
});
await test('mutations reject missing or foreign Origin', () => {
  const url = 'https://obrii.vercel.app/api/admin/content';
  assert.throws(() => sameOrigin(new Request(url)));
  assert.throws(() =>
    sameOrigin(
      new Request(url, { headers: { origin: 'https://evil.example' } }),
    ),
  );
  sameOrigin(
    new Request(url, { headers: { origin: 'https://obrii.vercel.app' } }),
  );
});
await test('content rejects malformed schemas, duplicate URLs, unsafe images and broken hero', () => {
  assert.deepEqual(validateContent(structuredClone(defaults)), defaults);
  const bad = structuredClone(defaults);
  bad.offers[1].slug = bad.offers[0].slug;
  assert.throws(() => validateContent(bad));
  const unsafe = structuredClone(defaults);
  unsafe.heroPanels[0].image = 'javascript:alert(1)';
  assert.throws(() => validateContent(unsafe));
  const hero = structuredClone(defaults);
  hero.heroPanels.pop();
  assert.throws(() => validateContent(hero));
  assert.throws(() => validateContent({ site: { name: 'broken' } }));
  const hidden = structuredClone(defaults);
  hidden.offers[0].published = false;
  assert.doesNotThrow(() => validateContent(hidden));
});
await test('uploads reject path traversal, SVG masquerading as PNG and oversize data', () => {
  assert.deepEqual(validateMedia([]), []);
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64');
  const path = 'public/assets/uploads/12345678-1234-1234-1234-123456789abc.png';
  assert.equal(validateMedia([{ path, content: png }]).length, 1);
  assert.throws(() =>
    validateMedia([{ path: 'public/../../app/page.tsx', content: png }]),
  );
  assert.throws(() =>
    validateMedia([
      {
        path,
        content: Buffer.from('<svg onload="alert(1)"></svg>').toString(
          'base64',
        ),
      },
    ]),
  );
  assert.throws(() =>
    validateMedia([
      { path, content: Buffer.alloc(2200000).toString('base64') },
    ]),
  );
});
await test('Git publish uses an atomic commit and rejects stale versions / concurrent changes', async () => {
  process.env.CMS_GITHUB_REPOSITORY = 'test/obrii';
  process.env.CMS_GITHUB_BRANCH = 'test-content';
  process.env.CMS_GITHUB_TOKEN = 'test-only';
  const original = globalThis.fetch,
    calls: { path: string; method: string; body: unknown }[] = [];
  let head = 'a'.repeat(40),
    race = false;
  globalThis.fetch = async (input, init) => {
    const path = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    ).pathname.replace('/repos/test/obrii/', '');
    const method = init?.method ?? 'GET',
      body = init?.body
        ? JSON.parse(typeof init.body === 'string' ? init.body : '{}')
        : null;
    calls.push({ path, method, body });
    if (path.startsWith('git/ref/'))
      return Response.json({ object: { sha: head } });
    if (path === 'contents/content/site.json')
      return Response.json({
        content: Buffer.from(JSON.stringify(defaults)).toString('base64'),
      });
    if (path.startsWith('git/commits/'))
      return Response.json({ tree: { sha: 'tree-base' } });
    if (path === 'git/trees') return Response.json({ sha: 'tree-next' });
    if (path === 'git/commits') return Response.json({ sha: 'b'.repeat(40) });
    if (path.startsWith('git/refs/')) {
      if (race) return Response.json({ message: 'race' }, { status: 422 });
      head = body.sha;
      return Response.json({ ok: true });
    }
    throw new Error('Unexpected API operation: ' + path);
  };
  try {
    const loaded = await readContent();
    assert.equal(loaded.version, head);
    const result = await publishContent(defaults, [], loaded.version);
    assert.equal(result.version, 'b'.repeat(40));
    assert.equal(
      (calls.find((c) => c.method === 'PATCH')!.body as { force: boolean })
        .force,
      false,
    );
    const tree = calls.find((c) => c.path === 'git/trees')!.body as {
      base_tree: string;
      tree: { path: string }[];
    };
    assert.equal(tree.base_tree, 'tree-base');
    assert.equal(tree.tree[0].path, 'content/site.json');
    const count = calls.length;
    await assert.rejects(() => publishContent(defaults, [], loaded.version), {
      status: 409,
    });
    assert.equal(calls.length, count + 1);
    race = true;
    await assert.rejects(() => publishContent(defaults, [], head), {
      status: 409,
    });
  } finally {
    globalThis.fetch = original;
  }
});
