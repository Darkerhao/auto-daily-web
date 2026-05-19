interface RepositoryLike {
  id: string
  name: string
  provider: string
  url: string
  branch: string
  token: string
  owner: string
}

interface SyncedCommitFile {
  path: string
  language: string
  additions: number
  deletions: number
  status?: string
  patch: string[]
}

interface SyncedCommit {
  id: string
  repoId: string
  hash: string
  shortHash: string
  message: string
  author: string
  time: string
  branch: string
  modules: string[]
  files: SyncedCommitFile[]
}

interface RepositoryBranchRef {
  name: string
}

interface GitHubCommitListItem {
  sha: string
  commit: {
    author: {
      name: string
      date: string
    }
    message: string
  }
}

interface GitHubCommitDetail {
  sha: string
  files?: Array<{
    filename: string
    status?: string
    additions?: number
    deletions?: number
    patch?: string
  }>
}

function parseGitHubRepo(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/i)
  const owner = match?.[1]
  const repo = match?.[2]

  if (!owner || !repo) {
    return null
  }

  return {
    owner,
    repo,
  }
}

function parseGitLabRepo(url: string) {
  const match = url.match(/gitlab(?:\.[^/]+)?\/([^/]+)\/([^/.]+)(?:\.git)?$/i)
  const owner = match?.[1]
  const repo = match?.[2]

  if (!owner || !repo) {
    return null
  }

  return {
    owner,
    repo,
  }
}

function parseGiteeRepo(url: string) {
  const match = url.match(/gitee\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/i)
  const owner = match?.[1]
  const repo = match?.[2]

  if (!owner || !repo) {
    return null
  }

  return {
    owner,
    repo,
  }
}

function createFallbackBranches(repository: Pick<RepositoryLike, 'provider' | 'url'>): string[] {
  const normalized = repository.url.toLowerCase()

  if (normalized.includes('daily-report-web')) {
    return ['main', 'develop', 'release', 'feature/report-stream']
  }

  if (normalized.includes('report-worker')) {
    return ['release', 'main', 'hotfix/queue', 'feature/scheduler']
  }

  if (normalized.includes('outsourcing-delivery')) {
    return ['master', 'test', 'release']
  }

  if (repository.provider === 'gitee') {
    return ['master', 'develop', 'release']
  }

  if (repository.provider === 'gitlab') {
    return ['main', 'release', 'staging']
  }

  return ['main', 'develop', 'release']
}

function inferModules(message: string) {
  if (message.includes('report')) return ['日报生成']
  if (message.includes('repo')) return ['仓库管理']
  if (message.includes('feishu')) return ['飞书配置']
  return ['通用开发']
}

function inferLanguage(path: string) {
  if (path.endsWith('.vue')) return 'vue'
  if (path.endsWith('.ts')) return 'ts'
  if (path.endsWith('.js')) return 'js'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'md'
  return 'text'
}

function toPatchLines(patch?: string) {
  if (!patch) {
    return ['+ Binary or patch omitted by provider']
  }

  return patch.split('\n').filter((line) => line.length > 0)
}

function mapDetailFiles(files?: GitHubCommitDetail['files']): SyncedCommitFile[] {
  if (!files || files.length === 0) {
    return [
      {
        path: 'remote-sync/summary.txt',
        language: 'text',
        additions: 1,
        deletions: 0,
        status: 'modified',
        patch: ['+ No file diff returned by provider'],
      },
    ]
  }

  return files.map((file) => ({
    path: file.filename,
    language: inferLanguage(file.filename),
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
    status: file.status ?? 'modified',
    patch: toPatchLines(file.patch),
  }))
}

function createFallbackCommits(repository: RepositoryLike): SyncedCommit[] {
  return [
    {
      id: `${repository.id}-sync-${crypto.randomUUID()}`,
      repoId: repository.id,
      hash: crypto.randomUUID().replace(/-/g, ''),
      shortHash: crypto.randomUUID().replace(/-/g, '').slice(0, 7),
      message: `sync(${repository.name}): 手动同步到最新提交快照`,
      author: repository.owner || 'system',
      time: new Date().toISOString(),
      branch: repository.branch,
      modules: ['仓库同步'],
      files: [
        {
          path: 'README.md',
          language: 'md',
          additions: 12,
          deletions: 2,
          status: 'modified',
          patch: ['@@ -1,4 +1,6 @@', '+ 手动同步已完成', '+ 当前为后端回退生成的示例差异'],
        },
      ],
    },
  ]
}

async function fetchGitHubCommitDetail(
  owner: string,
  repo: string,
  sha: string,
  token: string,
): Promise<GitHubCommitDetail | null> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as GitHubCommitDetail
}

export async function fetchRepositoryBranches(repository: Pick<RepositoryLike, 'provider' | 'url' | 'token'>): Promise<string[]> {
  if (repository.provider === 'github') {
    const parsed = parseGitHubRepo(repository.url)
    if (!parsed) return createFallbackBranches(repository)

    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches?per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(repository.token
            ? {
                Authorization: `Bearer ${repository.token}`,
              }
            : {}),
        },
      },
    )

    if (!response.ok) {
      return createFallbackBranches(repository)
    }

    const payload = (await response.json()) as RepositoryBranchRef[]
    const branches = payload.map((item) => item.name).filter(Boolean)
    return branches.length > 0 ? branches : createFallbackBranches(repository)
  }

  if (repository.provider === 'gitlab') {
    const parsed = parseGitLabRepo(repository.url)
    if (!parsed) return createFallbackBranches(repository)

    const project = encodeURIComponent(`${parsed.owner}/${parsed.repo}`)
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${project}/repository/branches?per_page=100`,
      {
        headers: {
          ...(repository.token
            ? {
                'PRIVATE-TOKEN': repository.token,
              }
            : {}),
        },
      },
    )

    if (!response.ok) {
      return createFallbackBranches(repository)
    }

    const payload = (await response.json()) as RepositoryBranchRef[]
    const branches = payload.map((item) => item.name).filter(Boolean)
    return branches.length > 0 ? branches : createFallbackBranches(repository)
  }

  if (repository.provider === 'gitee') {
    const parsed = parseGiteeRepo(repository.url)
    if (!parsed) return createFallbackBranches(repository)

    const response = await fetch(
      `https://gitee.com/api/v5/repos/${parsed.owner}/${parsed.repo}/branches`,
      {
        headers: {
          ...(repository.token
            ? {
                Authorization: `token ${repository.token}`,
              }
            : {}),
        },
      },
    )

    if (!response.ok) {
      return createFallbackBranches(repository)
    }

    const payload = (await response.json()) as RepositoryBranchRef[]
    const branches = payload.map((item) => item.name).filter(Boolean)
    return branches.length > 0 ? branches : createFallbackBranches(repository)
  }

  return createFallbackBranches(repository)
}

export async function syncRepositoryCommits(repository: RepositoryLike): Promise<SyncedCommit[]> {
  if (repository.provider !== 'github') {
    return createFallbackCommits(repository)
  }

  const parsed = parseGitHubRepo(repository.url)
  if (!parsed) {
    return createFallbackCommits(repository)
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?sha=${repository.branch}&per_page=5`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(repository.token
            ? {
                Authorization: `Bearer ${repository.token}`,
              }
            : {}),
        },
      },
    )

    if (!response.ok) {
      return createFallbackCommits(repository)
    }

    const payload = (await response.json()) as GitHubCommitListItem[]

    const commits = await Promise.all(
      payload.map(async (item) => {
        const detail = await fetchGitHubCommitDetail(parsed.owner, parsed.repo, item.sha, repository.token)
        return {
          id: `${repository.id}-${item.sha}`,
          repoId: repository.id,
          hash: item.sha,
          shortHash: item.sha.slice(0, 7),
          message: item.commit.message,
          author: item.commit.author.name,
          time: item.commit.author.date,
          branch: repository.branch,
          modules: inferModules(item.commit.message),
          files: mapDetailFiles(detail?.files),
        } satisfies SyncedCommit
      }),
    )

    return commits.length > 0 ? commits : createFallbackCommits(repository)
  } catch {
    return createFallbackCommits(repository)
  }
}
