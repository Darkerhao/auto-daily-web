import { getPgPool } from './client.js'
import { commits, feishuConfig, modelSettings, reports, repositories, user } from '../../store/mock-data.js'

export async function seedDatabase() {
  const pool = getPgPool()

  await pool.query(
    `
    INSERT INTO app_users (id, name, email, avatar, role, company, permissions)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      avatar = EXCLUDED.avatar,
      role = EXCLUDED.role,
      company = EXCLUDED.company,
      permissions = EXCLUDED.permissions
    `,
    [user.id, user.name, user.email, user.avatar, user.role, user.company, JSON.stringify(user.permissions)],
  )

  for (const repository of repositories) {
    await pool.query(
      `
      INSERT INTO repositories (
        id, name, provider, url, branch, token, sync_frequency, last_sync_at,
        owner, commit_count_today, enabled, tags
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
      ON CONFLICT (id) DO NOTHING
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
  }

  for (const report of reports) {
    await pool.query(
      `
      INSERT INTO reports (
        id, repo_id, repo_name, title, summary, markdown, style, commit_ids,
        token_cost, created_at, push_status, risk_items, tomorrow_plan
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12::jsonb,$13::jsonb)
      ON CONFLICT (id) DO NOTHING
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
  }

  for (const commit of commits) {
    await pool.query(
      `
      INSERT INTO commits (id, hash, short_hash, message, author, time, branch, modules, files, repo_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)
      ON CONFLICT (id) DO UPDATE SET
        hash = EXCLUDED.hash,
        short_hash = EXCLUDED.short_hash,
        message = EXCLUDED.message,
        author = EXCLUDED.author,
        time = EXCLUDED.time,
        branch = EXCLUDED.branch,
        modules = EXCLUDED.modules,
        files = EXCLUDED.files,
        repo_id = EXCLUDED.repo_id
      `,
      [
        commit.id,
        commit.hash,
        commit.shortHash,
        commit.message,
        commit.author,
        commit.time,
        commit.branch,
        JSON.stringify(commit.modules),
        JSON.stringify(commit.files),
        'repo-1',
      ],
    )
  }

  await pool.query(
    `
    INSERT INTO model_settings (
      id, provider, model_name, api_key, base_url, temperature, max_tokens,
      enable_streaming, merge_duplicate_commits, default_style
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (id) DO NOTHING
    `,
    [
      'default',
      modelSettings.provider,
      modelSettings.modelName,
      modelSettings.apiKey,
      modelSettings.baseUrl,
      modelSettings.temperature,
      modelSettings.maxTokens,
      modelSettings.enableStreaming,
      modelSettings.mergeDuplicateCommits,
      modelSettings.defaultStyle,
    ],
  )

  await pool.query(
    `
    INSERT INTO feishu_settings (
      id, webhook_url, bot_secret, doc_url, auto_send_time, enable_robot, enable_doc_sync
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (id) DO NOTHING
    `,
    [
      'default',
      feishuConfig.webhookUrl,
      feishuConfig.botSecret,
      feishuConfig.docUrl,
      feishuConfig.autoSendTime,
      feishuConfig.enableRobot,
      feishuConfig.enableDocSync,
    ],
  )
}
