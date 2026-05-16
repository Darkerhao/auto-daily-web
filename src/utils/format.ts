import dayjs from 'dayjs'

export function formatRelativeTime(value: string) {
  return dayjs(value).format('MM-DD HH:mm')
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function maskToken(token: string) {
  if (token.length <= 8) {
    return token
  }

  return `${token.slice(0, 4)}****${token.slice(-4)}`
}
