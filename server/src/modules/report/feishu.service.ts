import crypto from 'node:crypto'

interface ReportRecord {
  id: string
  repoId: string
  repoName: string
  title: string
  summary: string
  markdown: string
  style: string
  commitIds: string[]
  tokenCost: number
  createdAt: string
  pushStatus: string
  riskItems: string[]
  tomorrowPlan: string[]
}

interface FeishuConfig {
  webhookUrl: string
  botSecret: string
  docUrl: string
  appId: string
  appSecret: string
  autoSendTime: string
  enableRobot: boolean
  enableDocSync: boolean
}

interface FeishuSendResult {
  success: boolean
  message: string
  robotSent: boolean
  docSynced: boolean
  warnings: string[]
}

function createBotSignature(secret: string, timestamp: string) {
  const stringToSign = `${timestamp}\n${secret}`
  return crypto.createHmac('sha256', stringToSign).update('').digest('base64')
}

function extractDocumentId(docUrl: string) {
  const match = docUrl.match(/\/docx\/([^/?#]+)/i)
  return match?.[1] ?? ''
}

function markdownToBlocks(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 50)
    .map((line) => ({
      block_type: 2,
      text: {
        elements: [
          {
            text_run: {
              content: line,
            },
          },
        ],
      },
    }))
}

async function sendRobotMessage(report: ReportRecord, config: FeishuConfig) {
  if (!config.enableRobot) {
    return false
  }

  if (!config.webhookUrl) {
    throw new Error('未配置飞书机器人 Webhook 地址')
  }

  const timestamp = `${Math.floor(Date.now() / 1000)}`
  const signature = config.botSecret ? createBotSignature(config.botSecret, timestamp) : undefined
  const payload = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title: report.title,
          content: [
            [
              {
                tag: 'text',
                text: `${report.summary}\n\n${report.markdown}`,
              },
            ],
          ],
        },
      },
    },
    ...(signature
      ? {
          timestamp,
          sign: signature,
        }
      : {}),
  }

  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`飞书机器人推送失败（HTTP ${response.status}）：${detail}`)
  }

  return true
}

async function getTenantAccessToken(config: FeishuConfig) {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`获取飞书 tenant_access_token 失败（HTTP ${response.status}）：${detail}`)
  }

  const payload = (await response.json()) as {
    tenant_access_token?: string
    code?: number
    msg?: string
  }

  if (!payload.tenant_access_token) {
    throw new Error(payload.msg || '飞书 tenant_access_token 返回为空')
  }

  return payload.tenant_access_token
}

async function syncReportToDoc(report: ReportRecord, config: FeishuConfig) {
  if (!config.enableDocSync) {
    return false
  }

  if (!config.docUrl) {
    throw new Error('未配置飞书文档地址')
  }

  if (!config.appId || !config.appSecret) {
    throw new Error('文档同步缺少 App ID / App Secret')
  }

  const documentId = extractDocumentId(config.docUrl)
  if (!documentId) {
    throw new Error('无法从飞书文档地址中解析 document_id')
  }

  const tenantAccessToken = await getTenantAccessToken(config)
  const response = await fetch(
    `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tenantAccessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        children: markdownToBlocks(report.markdown),
        index: -1,
      }),
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`飞书文档同步失败（HTTP ${response.status}）：${detail}`)
  }

  return true
}

export async function sendReportToFeishu(report: ReportRecord, config: FeishuConfig): Promise<FeishuSendResult> {
  const warnings: string[] = []
  let robotSent = false
  let docSynced = false

  try {
    robotSent = await sendRobotMessage(report, config)
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : '飞书机器人推送失败')
  }

  try {
    docSynced = await syncReportToDoc(report, config)
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : '飞书文档同步失败')
  }

  const success = robotSent || docSynced
  const message = success
    ? warnings.length > 0
      ? '飞书推送部分成功，请检查未完成通道的告警信息。'
      : '已成功推送到飞书。'
    : '飞书推送失败，请检查机器人或文档同步配置。'

  return {
    success,
    message,
    robotSent,
    docSynced,
    warnings,
  }
}
