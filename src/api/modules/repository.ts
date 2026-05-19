import { request } from '../request'
import type {
  RepositoryBranchOption,
  RepositoryConnectionResult,
  RepositoryForm,
  RepositoryItem,
} from '@/types/repository'

export const repositoryApi = {
  list() {
    return request.get<RepositoryItem[]>('/repository/list')
  },
  save(payload: RepositoryForm) {
    return request.post<RepositoryItem>('/repository/create', payload)
  },
  remove(id: string) {
    return request.delete<boolean>(`/repository/delete?repoId=${id}`)
  },
  test(payload: RepositoryForm) {
    return request.post<RepositoryConnectionResult>('/repository/test', payload)
  },
  fetchBranches(payload: Pick<RepositoryForm, 'provider' | 'url' | 'token'>) {
    return request.post<RepositoryBranchOption[]>('/repository/branches', payload)
  },
  sync(repoId: string) {
    return request.post<{ repoId: string; syncedCount: number; latestCommit: string; message: string }>(
      '/repository/sync',
      { repoId },
    )
  },
}
