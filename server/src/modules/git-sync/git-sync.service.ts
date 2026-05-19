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

interface RepositoryConnectionTestInput {
  provider: string
  url: string
  branch: string
  token: string
}

interface RepositoryConnectionTestResult {
  success: boolean
  latency: number
  branchExists: boolean
  lastCommitHash: string
  message: string
}

interface ParsedRepository {
  owner: string
  repo: string
  host?: string
}

interface RemoteCommitListItem {
  hash: string
  shortHash: string
  message: string
  author: string
  time: string
}

interface GitHubCommitListItem {
  sha: string
  commit: {
    author?: {
      name?: string
      date?: string
    }
    committer?: {
      name?: string
      date?: string
    }
    message: string
  }
}

interface GitHubCommitDetail {
  files?: Array<{
    filename: string
    status?: string
    additions?: number
    deletions?: number
    patch?: string
  }>
}

interface GitLabCommitListItem {
  id: string
  short_id?: string
  title?: string
  message?: string
  author_name?: string
  authored_date?: string
  committed_date?: string
}

interface GitLabCommitDiffFile {
  new_path?: string
  old_path?: string
  diff?: string
  new_file?: boolean
  deleted_file?: boolean
  renamed_file?: boolean
}

interface GiteeCommitListItem {
  sha: string
  commit?: {
    author?: {
      name?: string
      date?: string
    }
    committer?: {
      name?: string
      date?: string
    }
    message?: string
  }
}

interface GiteeCommitDetail {
  files?: Array<{
    filename?: string
    raw_url?: string
    status?: string
    additions?: number
    deletions?: number
    patch?: string
  }>
}

function parseGitHubRepo(url: string): ParsedRepository | null {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i)
  const owner = match?.[1]
  const repo = match?.[2]

  return owner && repo ? { owner, repo } : null
}

function parseGitLabRepo(url: string): ParsedRepository | null {
  const match = url.match(/(gitlab(?:\.[^/:]+)?)[/:]([^/]+)\/(.+?)(?:\.git)?$/i)
  const host = match?.[1] ?? 'gitlab.com'
  const owner = match?.[2]
  const repo = match?.[3]

  return owner && repo ? { owner, repo, host } : null
}

function parseGiteeRepo(url: string): ParsedRepository | null {
  const match = url.match(/gitee\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i)
  const owner = match?.[1]
  const repo = match?.[2]

  return owner && repo ? { owner, repo } : null
}

function parseRepositoryByProvider(provider: string, url: string) {
  if (provider === 'github') return parseGitHubRepo(url)
  if (provider === 'gitlab') return parseGitLabRepo(url)
  if (provider === 'gitee') return parseGiteeRepo(url)
  return null
}

function createProviderHeaders(provider: string, token: string): HeadersInit {
  if (provider === 'github') {
    return {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  if (provider === 'gitlab') {
    return token ? { 'PRIVATE-TOKEN': token } : {}
  }

  if (provider === 'gitee') {
    return token ? { Authorization: `token ${token}` } : {}
  }

  return {}
}

function formatProviderName(provider: string) {
  const names: Record<string, string> = {
    github: 'GitHub',
    gitlab: 'GitLab',
    gitee: 'Gitee',
  }

  return names[provider] ?? provider
}

function formatProviderError(provider: string, status: number) {
  const name = formatProviderName(provider)

  if (status === 401 || status === 403) {
    return `${name} 访问被拒绝，请检查访问令牌权限。`
  }

  if (status === 404) {
    return `${name} 仓库不存在、分支不存在，或当前令牌无权访问。`
  }

  return `${name} 连接失败，远端返回 HTTP ${status}。`
}

async function fetchJson<T>(url: string, provider: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: createProviderHeaders(provider, token),
  })

  if (!response.ok) {
    throw new Error(formatProviderError(provider, response.status))
  }

  return (await response.json()) as T
}

function buildBranchesUrl(provider: string, parsed: ParsedRepository) {
  if (provider === 'github') {
    return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches?per_page=100`
  }

  if (provider === 'gitlab') {
    const project = encodeURIComponent(`${parsed.owner}/${parsed.repo}`)
    return `https://${parsed.host ?? 'gitlab.com'}/api/v4/projects/${project}/repository/branches?per_page=100`
  }

  if (provider === 'gitee') {
    return `https://gitee.com/api/v5/repos/${parsed.owner}/${parsed.repo}/branches`
  }

  return ''
}

function buildCommitsUrl(provider: string, parsed: ParsedRepository, branch: string, perPage: number) {
  const encodedBranch = encodeURIComponent(branch)

  if (provider === 'github') {
    return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?sha=${encodedBranch}&per_page=${perPage}`
  }

  if (provider === 'gitlab') {
    const project = encodeURIComponent(`${parsed.owner}/${parsed.repo}`)
    return `https://${parsed.host ?? 'gitlab.com'}/api/v4/projects/${project}/repository/commits?ref_name=${encodedBranch}&per_page=${perPage}`
  }

  if (provider === 'gitee') {
    return `https://gitee.com/api/v5/repos/${parsed.owner}/${parsed.repo}/commits?sha=${encodedBranch}&per_page=${perPage}`
  }

  return ''
}

function inferModules(message: string, files: SyncedCommitFile[] = []) {
  const source = `${message} ${files.map((file) => file.path).join(' ')}`.toLowerCase()
  const modules: string[] = []

  if (/report|日报|prompt/.test(source)) modules.push('日报生成')
  if (/repo|repository|git-sync|仓库/.test(source)) modules.push('仓库管理')
  if (/feishu|飞书/.test(source)) modules.push('飞书配置')
  if (/setting|config|env|配置/.test(source)) modules.push('设置中心')
  if (/auth|login|permission|权限|登录/.test(source)) modules.push('认证权限')
  if (/dashboard|chart|summary|看板/.test(source)) modules.push('控制台')
  if (/style|less|css|vue|component|组件/.test(source)) modules.push('前端界面')
  if (/api|server|module|service|schema/.test(source)) modules.push('后端接口')

  return modules.length > 0 ? [...new Set(modules)] : ['通用开发']
}

function inferLanguage(path: string) {
  if (path.endsWith('.vue')) return 'vue'
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'ts'
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'js'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'md'
  if (path.endsWith('.less')) return 'less'
  if (path.endsWith('.css')) return 'css'
  return 'text'
}

function toPatchLines(patch?: string) {
  if (!patch?.trim()) {
    return ['# 代码托管平台未返回该文件 patch，可能是二进制文件、文件过大或权限受限。']
  }

  return patch.split('\n')
}

function countPatchLines(lines: string[]) {
  return lines.reduce(
    (result, line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) result.additions += 1
      if (line.startsWith('-') && !line.startsWith('---')) result.deletions += 1
      return result
    },
    { additions: 0, deletions: 0 },
  )
}

function mapGitHubFiles(files: GitHubCommitDetail['files']): SyncedCommitFile[] {
  return (files ?? []).map((file) => ({
    path: file.filename,
    language: inferLanguage(file.filename),
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
    status: file.status ?? 'modified',
    patch: toPatchLines(file.patch),
  }))
}

function mapGitLabFiles(files: GitLabCommitDiffFile[]): SyncedCommitFile[] {
  return files.map((file) => {
    const patch = toPatchLines(file.diff)
    const stats = countPatchLines(patch)
    const path = file.new_path || file.old_path || 'unknown'
    const status = file.deleted_file ? 'removed' : file.new_file ? 'added' : file.renamed_file ? 'renamed' : 'modified'

    return {
      path,
      language: inferLanguage(path),
      additions: stats.additions,
      deletions: stats.deletions,
      status,
      patch,
    }
  })
}

function mapGiteeFiles(files: GiteeCommitDetail['files']): SyncedCommitFile[] {
  return (files ?? []).map((file) => ({
    path: file.filename ?? file.raw_url ?? 'unknown',
    language: inferLanguage(file.filename ?? ''),
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
    status: file.status ?? 'modified',
    patch: toPatchLines(file.patch),
  }))
}

function mapCommitListItem(provider: string, item: GitHubCommitListItem | GitLabCommitListItem | GiteeCommitListItem): RemoteCommitListItem {
  if (provider === 'gitlab') {
    const commit = item as GitLabCommitListItem
    return {
      hash: commit.id,
      shortHash: commit.short_id || commit.id.slice(0, 7),
      message: commit.message || commit.title || '',
      author: commit.author_name || 'unknown',
      time: commit.authored_date || commit.committed_date || new Date().toISOString(),
    }
  }

  if (provider === 'gitee') {
    const commit = item as GiteeCommitListItem
    return {
      hash: commit.sha,
      shortHash: commit.sha.slice(0, 7),
      message: commit.commit?.message ?? '',
      author: commit.commit?.author?.name || commit.commit?.committer?.name || 'unknown',
      time: commit.commit?.author?.date || commit.commit?.committer?.date || new Date().toISOString(),
    }
  }

  const commit = item as GitHubCommitListItem
  return {
    hash: commit.sha,
    shortHash: commit.sha.slice(0, 7),
    message: commit.commit.message,
    author: commit.commit.author?.name || commit.commit.committer?.name || 'unknown',
    time: commit.commit.author?.date || commit.commit.committer?.date || new Date().toISOString(),
  }
}

async function fetchCommitFiles(provider: string, parsed: ParsedRepository, sha: string, token: string): Promise<SyncedCommitFile[]> {
  if (provider === 'github') {
    const detail = await fetchJson<GitHubCommitDetail>(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${sha}`,
      provider,
      token,
    )
    return mapGitHubFiles(detail.files)
  }

  if (provider === 'gitlab') {
    const project = encodeURIComponent(`${parsed.owner}/${parsed.repo}`)
    const files = await fetchJson<GitLabCommitDiffFile[]>(
      `https://${parsed.host ?? 'gitlab.com'}/api/v4/projects/${project}/repository/commits/${sha}/diff?per_page=100`,
      provider,
      token,
    )
    return mapGitLabFiles(files)
  }

  if (provider === 'gitee') {
    const detail = await fetchJson<GiteeCommitDetail>(
      `https://gitee.com/api/v5/repos/${parsed.owner}/${parsed.repo}/commits/${sha}`,
      provider,
      token,
    )
    return mapGiteeFiles(detail.files)
  }

  return []
}

async function fetchLatestCommitHash(
  provider: string,
  parsed: ParsedRepository,
  branch: string,
  token: string,
) {
  const commitsUrl = buildCommitsUrl(provider, parsed, branch, 1)
  if (!commitsUrl) return ''

  const payload = await fetchJson<Array<GitHubCommitListItem | GitLabCommitListItem | GiteeCommitListItem>>(
    commitsUrl,
    provider,
    token,
  )

  const first = payload[0]
  return first ? mapCommitListItem(provider, first).shortHash : ''
}

export async function fetchRepositoryBranches(repository: Pick<RepositoryLike, 'provider' | 'url' | 'token'>): Promise<string[]> {
  const parsed = parseRepositoryByProvider(repository.provider, repository.url)

  if (!parsed) {
    throw new Error('仓库地址格式不正确，请输入完整地址，例如 https://github.com/org/repo。')
  }

  const branchesUrl = buildBranchesUrl(repository.provider, parsed)
  if (!branchesUrl) {
    throw new Error('当前仓库类型暂未接入真实分支查询，请选择 GitHub、GitLab 或 Gitee。')
  }

  const payload = await fetchJson<RepositoryBranchRef[]>(branchesUrl, repository.provider, repository.token)
  const branches = payload.map((item) => item.name).filter(Boolean)

  if (branches.length === 0) {
    throw new Error('远端仓库未返回任何分支，请检查仓库权限或默认分支配置。')
  }

  return branches
}

export async function testRepositoryConnection(
  repository: RepositoryConnectionTestInput,
): Promise<RepositoryConnectionTestResult> {
  const startedAt = Date.now()
  const parsed = parseRepositoryByProvider(repository.provider, repository.url)

  if (!parsed) {
    return {
      success: false,
      latency: Date.now() - startedAt,
      branchExists: false,
      lastCommitHash: '',
      message: '仓库地址格式不正确，请输入完整地址，例如 https://github.com/org/repo。',
    }
  }

  const branchesUrl = buildBranchesUrl(repository.provider, parsed)
  if (!branchesUrl) {
    return {
      success: false,
      latency: Date.now() - startedAt,
      branchExists: false,
      lastCommitHash: '',
      message: '当前仓库类型暂未接入真实连接测试，请选择 GitHub、GitLab 或 Gitee。',
    }
  }

  try {
    const payload = await fetchJson<RepositoryBranchRef[]>(branchesUrl, repository.provider, repository.token)
    const latency = Date.now() - startedAt
    const branches = payload.map((item) => item.name).filter(Boolean)
    const branchExists = branches.includes(repository.branch)
    const lastCommitHash = branchExists
      ? await fetchLatestCommitHash(repository.provider, parsed, repository.branch, repository.token)
      : ''

    return {
      success: branchExists,
      latency,
      branchExists,
      lastCommitHash,
      message: branchExists
        ? '仓库连接测试通过，目标分支已在远端仓库中识别。'
        : `仓库可访问，但未找到分支 ${repository.branch}，请重新选择分支。`,
    }
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - startedAt,
      branchExists: false,
      lastCommitHash: '',
      message: error instanceof Error ? error.message : '仓库连接请求失败，请检查网络、仓库地址或访问令牌。',
    }
  }
}

export async function syncRepositoryCommits(repository: RepositoryLike): Promise<SyncedCommit[]> {
  const parsed = parseRepositoryByProvider(repository.provider, repository.url)

  if (!parsed) {
    throw new Error('仓库地址格式不正确，无法同步真实 Commit。')
  }

  const commitsUrl = buildCommitsUrl(repository.provider, parsed, repository.branch, 10)
  if (!commitsUrl) {
    throw new Error('当前仓库类型暂未接入真实 Commit 同步，请选择 GitHub、GitLab 或 Gitee。')
  }

  const payload = await fetchJson<Array<GitHubCommitListItem | GitLabCommitListItem | GiteeCommitListItem>>(
    commitsUrl,
    repository.provider,
    repository.token,
  )

  if (payload.length === 0) {
    throw new Error(`远端分支 ${repository.branch} 暂无可同步 Commit。`)
  }

  return Promise.all(
    payload.map(async (item) => {
      const commit = mapCommitListItem(repository.provider, item)
      const files = await fetchCommitFiles(repository.provider, parsed, commit.hash, repository.token)

      return {
        id: `${repository.id}-${commit.hash}`,
        repoId: repository.id,
        hash: commit.hash,
        shortHash: commit.shortHash,
        message: commit.message,
        author: commit.author,
        time: commit.time,
        branch: repository.branch,
        modules: inferModules(commit.message, files),
        files,
      } satisfies SyncedCommit
    }),
  )
}
