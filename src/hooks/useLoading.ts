import { ref } from 'vue'

export function useLoading() {
  const loading = ref(false)

  async function withLoading<T>(task: () => Promise<T>) {
    loading.value = true
    try {
      return await task()
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    withLoading,
  }
}
