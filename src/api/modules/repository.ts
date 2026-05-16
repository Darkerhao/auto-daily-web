import { request } from '../request'
import type {
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
}
