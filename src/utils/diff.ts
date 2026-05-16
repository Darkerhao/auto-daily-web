import type { CommitItem, DiffFile } from '@/types/report'

export function collectCommitFiles(commits: CommitItem[]) {
  return commits.flatMap((commit) => commit.files)
}

export function sumDiffStats(files: DiffFile[]) {
  return files.reduce(
    (accumulator, file) => ({
      additions: accumulator.additions + file.additions,
      deletions: accumulator.deletions + file.deletions,
    }),
    { additions: 0, deletions: 0 },
  )
}

export function uniqueModules(commits: CommitItem[]) {
  return [...new Set(commits.flatMap((commit) => commit.modules))]
}
