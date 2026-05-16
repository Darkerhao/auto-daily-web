import { getPgPool } from '../pg/client.js'

export function createPgRepository() {
  const pool = getPgPool()

  return {
    async getUser() {
      const result = await pool.query('SELECT * FROM app_users LIMIT 1')
      const row = result.rows[0]
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        role: row.role,
        company: row.company,
      }
    },
    async getDashboardSummary() {
      const repositories = await this.listRepositories()
      const reports = await this.listReports()
      return {
        metrics: [
          { key: 'commits', label: '今日 Commit 数', value: '22', trend: '+18.6%', status: 'brand' },
          { key: 'reports', label: '今日生成日报', value: String(reports.length), trend: '+9.4%', status: 'success' },
          { key: 'tokens', label: 'AI Token 消耗', value: '18,420', trend: '+5.1%', status: 'warning' },
          { key: 'feishu', label: '飞书推送成功率', value: '98.4%', trend: '+1.8%', status: 'success' },
        ],
        tokenTrend: [
          { date: '05-12', value: 8400 },
          { date: '05-13', value: 10200 },
          { date: '05-14', value: 12100 },
          { date: '05-15', value: 14700 },
          { date: '05-16', value: 18420 },
        ],
        recentReports: reports,
        repositories,
        activity: [
          {
            id: 'activity-1',
            title: '日报已推送到飞书群',
            description: 'daily-report-web 今日摘要已同步到 飞书-研发日报 群。',
            time: '5 分钟前',
            type: 'push',
          },
        ],
      }
    },
    async listRepositories() {
      const result = await pool.query('SELECT * FROM repositories ORDER BY last_sync_at DESC')
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        provider: row.provider,
        url: row.url,
        branch: row.branch,
        token: row.token,
        syncFrequency: row.sync_frequency,
        lastSyncAt: row.last_sync_at,
        owner: row.owner,
        commitCountToday: row.commit_count_today,
        enabled: row.enabled,
        tags: row.tags,
      }))
    },
    async saveRepository(repository: {
      id: string
      name: string
      provider: string
      url: string
      branch: string
      token: string
      syncFrequency: string
      lastSyncAt: string
      owner: string
      commitCountToday: number
      enabled: boolean
      tags: string[]
    }) {
      await pool.query(
        `
        INSERT INTO repositories (
          id, name, provider, url, branch, token, sync_frequency, last_sync_at,
          owner, commit_count_today, enabled, tags
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          provider = EXCLUDED.provider,
          url = EXCLUDED.url,
          branch = EXCLUDED.branch,
          token = EXCLUDED.token,
          sync_frequency = EXCLUDED.sync_frequency,
          last_sync_at = EXCLUDED.last_sync_at,
          owner = EXCLUDED.owner,
          commit_count_today = EXCLUDED.commit_count_today,
          enabled = EXCLUDED.enabled,
          tags = EXCLUDED.tags
        `,
        [
          repository.id,
          repository.name,
          repository.provider,
          repository.url,
          repository.branch,
          repository.token,
          repository.syncFrequency,
          repository.lastSyncAt,
          repository.owner,
          repository.commitCountToday,
          repository.enabled,
          JSON.stringify(repository.tags),
        ],
      )
      return repository
    },
    async removeRepository(id: string) {
      await pool.query('DELETE FROM repositories WHERE id = $1', [id])
      return true
    },
    async listReports() {
      const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC')
      return result.rows.map((row) => ({
        id: row.id,
        repoId: row.repo_id,
        repoName: row.repo_name,
        title: row.title,
        summary: row.summary,
        markdown: row.markdown,
        style: row.style,
        commitIds: row.commit_ids,
        tokenCost: row.token_cost,
        createdAt: row.created_at,
        pushStatus: row.push_status,
        riskItems: row.risk_items,
        tomorrowPlan: row.tomorrow_plan,
      }))
    },
    async saveReport(report: {
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
    }) {
      await pool.query(
        `
        INSERT INTO reports (
          id, repo_id, repo_name, title, summary, markdown, style, commit_ids,
          token_cost, created_at, push_status, risk_items, tomorrow_plan
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12::jsonb,$13::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          repo_id = EXCLUDED.repo_id,
          repo_name = EXCLUDED.repo_name,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          markdown = EXCLUDED.markdown,
          style = EXCLUDED.style,
          commit_ids = EXCLUDED.commit_ids,
          token_cost = EXCLUDED.token_cost,
          created_at = EXCLUDED.created_at,
          push_status = EXCLUDED.push_status,
          risk_items = EXCLUDED.risk_items,
          tomorrow_plan = EXCLUDED.tomorrow_plan
        `,
        [
          report.id,
          report.repoId,
          report.repoName,
          report.title,
          report.summary,
          report.markdown,
          report.style,
          JSON.stringify(report.commitIds),
          report.tokenCost,
          report.createdAt,
          report.pushStatus,
          JSON.stringify(report.riskItems),
          JSON.stringify(report.tomorrowPlan),
        ],
      )
      return report
    },
    async markReportPushed(reportId: string) {
      await pool.query(
        `
        UPDATE reports
        SET push_status = 'success'
        WHERE id = $1
        `,
        [reportId],
      )
      const result = await pool.query('SELECT * FROM reports WHERE id = $1 LIMIT 1', [reportId])
      const row = result.rows[0]
      if (!row) {
        return null
      }
      return {
        id: row.id,
        repoId: row.repo_id,
        repoName: row.repo_name,
        title: row.title,
        summary: row.summary,
        markdown: row.markdown,
        style: row.style,
        commitIds: row.commit_ids,
        tokenCost: row.token_cost,
        createdAt: row.created_at,
        pushStatus: row.push_status,
        riskItems: row.risk_items,
        tomorrowPlan: row.tomorrow_plan,
      }
    },
    async listCommitsByRepo(repoId: string) {
      const result = await pool.query('SELECT * FROM commits ORDER BY time DESC')
      return result.rows.map((row) => ({
        id: `${repoId}-${row.id}`,
        hash: row.hash,
        shortHash: row.short_hash,
        message: row.message,
        author: row.author,
        time: row.time,
        branch: row.branch,
        modules: row.modules,
        files: row.files,
      }))
    },
    async getModelSettings() {
      const result = await pool.query('SELECT * FROM model_settings WHERE id = $1 LIMIT 1', ['default'])
      const row = result.rows[0]
      return {
        provider: row.provider,
        modelName: row.model_name,
        apiKey: row.api_key,
        baseUrl: row.base_url,
        temperature: row.temperature,
        maxTokens: row.max_tokens,
        enableStreaming: row.enable_streaming,
        mergeDuplicateCommits: row.merge_duplicate_commits,
        defaultStyle: row.default_style,
      }
    },
    async saveModelSettings(payload: {
      provider: string
      modelName: string
      apiKey: string
      baseUrl: string
      temperature: number
      maxTokens: number
      enableStreaming: boolean
      mergeDuplicateCommits: boolean
      defaultStyle: string
    }) {
      await pool.query(
        `
        INSERT INTO model_settings (
          id, provider, model_name, api_key, base_url, temperature, max_tokens,
          enable_streaming, merge_duplicate_commits, default_style
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET
          provider = EXCLUDED.provider,
          model_name = EXCLUDED.model_name,
          api_key = EXCLUDED.api_key,
          base_url = EXCLUDED.base_url,
          temperature = EXCLUDED.temperature,
          max_tokens = EXCLUDED.max_tokens,
          enable_streaming = EXCLUDED.enable_streaming,
          merge_duplicate_commits = EXCLUDED.merge_duplicate_commits,
          default_style = EXCLUDED.default_style
        `,
        [
          'default',
          payload.provider,
          payload.modelName,
          payload.apiKey,
          payload.baseUrl,
          payload.temperature,
          payload.maxTokens,
          payload.enableStreaming,
          payload.mergeDuplicateCommits,
          payload.defaultStyle,
        ],
      )
      return payload
    },
    async getFeishuConfig() {
      const result = await pool.query('SELECT * FROM feishu_settings WHERE id = $1 LIMIT 1', ['default'])
      const row = result.rows[0]
      return {
        webhookUrl: row.webhook_url,
        botSecret: row.bot_secret,
        docUrl: row.doc_url,
        autoSendTime: row.auto_send_time,
        enableRobot: row.enable_robot,
        enableDocSync: row.enable_doc_sync,
      }
    },
    async saveFeishuConfig(payload: {
      webhookUrl: string
      botSecret: string
      docUrl: string
      autoSendTime: string
      enableRobot: boolean
      enableDocSync: boolean
    }) {
      await pool.query(
        `
        INSERT INTO feishu_settings (
          id, webhook_url, bot_secret, doc_url, auto_send_time, enable_robot, enable_doc_sync
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          webhook_url = EXCLUDED.webhook_url,
          bot_secret = EXCLUDED.bot_secret,
          doc_url = EXCLUDED.doc_url,
          auto_send_time = EXCLUDED.auto_send_time,
          enable_robot = EXCLUDED.enable_robot,
          enable_doc_sync = EXCLUDED.enable_doc_sync
        `,
        [
          'default',
          payload.webhookUrl,
          payload.botSecret,
          payload.docUrl,
          payload.autoSendTime,
          payload.enableRobot,
          payload.enableDocSync,
        ],
      )
      return payload
    },
  }
}
