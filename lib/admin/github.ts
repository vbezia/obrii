import {
  AdminError,
  type Content,
  type Media,
  validateContent,
} from './validation.ts';
const FILE = 'content/site.json';
function config() {
  const repo = process.env.CMS_GITHUB_REPOSITORY;
  const branch = process.env.CMS_GITHUB_BRANCH;
  const token = process.env.CMS_GITHUB_TOKEN;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo) || !branch || !token)
    throw new AdminError(
      'Сховище контенту ще не підключено. Зверніться до розробника.',
      503,
    );
  // Preview deployments must have their own explicit branch configuration.
  if (process.env.VERCEL_ENV === 'preview' && branch === 'main')
    throw new AdminError('Для preview потрібна окрема гілка контенту.', 503);
  return { repo, branch, token };
}
async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const { repo, token } = config();
  const res = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    method,
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok)
    throw new AdminError(
      res.status === 409 || res.status === 422
        ? 'Версія змінилась. Збережіть свою копію та завантажте актуальний контент.'
        : 'Не вдалося звернутися до сховища. Перевірте підключення або повторіть пізніше.',
      res.status === 409 || res.status === 422 ? 409 : 502,
    );
  return res.json() as Promise<T>;
}
export async function readContent() {
  const { branch } = config();
  const ref = await api<{ object: { sha: string } }>(
    `git/ref/heads/${encodeURIComponent(branch)}`,
  );
  const file = await api<{ content: string }>(
    `contents/${FILE}?ref=${ref.object.sha}`,
  );
  const content = validateContent(
    JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')),
  );
  return { content, version: ref.object.sha };
}
export async function publishContent(
  content: Content,
  media: Media[],
  version: string,
) {
  const { branch } = config();
  const ref = await api<{ object: { sha: string } }>(
    `git/ref/heads/${encodeURIComponent(branch)}`,
  );
  if (ref.object.sha !== version)
    throw new AdminError(
      'Контент або код уже оновили. Завантажте актуальну версію перед публікацією.',
      409,
    );
  const parent = await api<{ tree: { sha: string } }>(`git/commits/${version}`);
  const tree: {
    path: string;
    mode: string;
    type: string;
    content?: string;
    sha?: string;
  }[] = [
    {
      path: FILE,
      mode: '100644',
      type: 'blob',
      content: JSON.stringify(content, null, 2) + '\n',
    },
  ];
  for (const file of media) {
    const blob = await api<{ sha: string }>('git/blobs', 'POST', {
      content: file.content,
      encoding: 'base64',
    });
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const nextTree = await api<{ sha: string }>('git/trees', 'POST', {
    base_tree: parent.tree.sha,
    tree,
  });
  const commit = await api<{ sha: string }>('git/commits', 'POST', {
    message: 'content: publish from OBRII admin',
    tree: nextTree.sha,
    parents: [version],
  });
  await api(`git/refs/heads/${encodeURIComponent(branch)}`, 'PATCH', {
    sha: commit.sha,
    force: false,
  });
  return { version: commit.sha };
}
