import { ref } from 'vue'
import { defineStore } from 'pinia'
import { repositoryApi } from '@/api/modules/repository'
import type {
  RepositoryConnectionResult,
  RepositoryForm,
  RepositoryItem,
} from '@/types/repository'

export const useRepositoryStore = defineStore('repository', () => {
  const repositories = ref<RepositoryItem[]>([])
  const lastConnectionResult = ref<RepositoryConnectionResult | null>(null)

  async function fetchRepositories() {
    repositories.value = await repositoryApi.list()
    return repositories.value
  }

  async function saveRepository(payload: RepositoryForm) {
    const repository = await repositoryApi.save(payload)
    await fetchRepositories()
    return repository
  }

  async function deleteRepository(id: string) {
    await repositoryApi.remove(id)
    await fetchRepositories()
  }

  async function testConnection(payload: RepositoryForm) {
    lastConnectionResult.value = await repositoryApi.test(payload)
    return lastConnectionResult.value
  }

  async function syncRepository(id: string) {
    const result = await repositoryApi.sync(id)
    await fetchRepositories()
    return result
  }

  return {
    repositories,
    lastConnectionResult,
    fetchRepositories,
    saveRepository,
    deleteRepository,
    testConnection,
    syncRepository,
  }
})
