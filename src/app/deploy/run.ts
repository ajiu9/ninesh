import type { ArgumentsCamelCase } from 'yargs'
import { existsSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import * as p from '@clack/prompts'
import { execa } from 'execa'
import fs from 'fs-extra'
import c from 'picocolors'
import { defaultServerConfig, type DeployConfig, type DeployProjectConfig, loadDeployConfig, saveDeployConfig } from './config'
import { ensurePackages, importFromCWD } from './utils'

// ============================================================
// init
// ============================================================
async function runInit(): Promise<void> {
  p.intro(c.green('ninesh deploy init'))

  const existingConfig = await loadDeployConfig()

  if (existingConfig.projects.length > 0) {
    p.log.info(c.yellow('配置文件已存在'))
    const shouldContinue = await p.confirm({
      message: '是否继续添加新项目？',
      initialValue: false,
    })
    if (p.isCancel(shouldContinue) || !shouldContinue) {
      p.outro()
      return
    }
    await runAdd(existingConfig)
    return
  }

  // 配置 server
  const serverConfig = await p.group({
    port: () => p.text({
      message: 'Webhook 服务端口',
      placeholder: String(defaultServerConfig.port),
      initialValue: String(defaultServerConfig.port),
      validate: (value) => {
        const port = Number.parseInt(value, 10)
        if (Number.isNaN(port) || port < 1 || port > 65535)
          return '请输入有效的端口号 (1-65535)'
      },
    }),
    path: () => p.text({
      message: 'Webhook 路径',
      placeholder: defaultServerConfig.path,
      initialValue: defaultServerConfig.path,
    }),
    secret: () => p.text({
      message: 'Webhook 密钥 (用于验证 GitHub 请求)',
      validate: (value) => {
        if (!value || value.length < 6)
          return '密钥长度至少 6 个字符'
      },
    }),
  }, {
    onCancel: () => {
      p.cancel('已取消')
      process.exit(0)
    },
  })

  const config: DeployConfig = {
    server: {
      port: Number.parseInt(serverConfig.port, 10),
      path: serverConfig.path,
      secret: serverConfig.secret,
    },
    projects: [],
  }

  await saveDeployConfig(config)
  p.log.success(c.green('服务器配置已保存'))

  // 引导添加第一个项目
  const shouldAddProject = await p.confirm({
    message: '是否添加第一个项目？',
    initialValue: true,
  })

  if (p.isCancel(shouldAddProject) || !shouldAddProject) {
    p.outro(c.dim(`配置文件: ${c.cyan('~/.ninesh/deploy.json')}`))
    return
  }

  await runAdd(config)
}

// ============================================================
// add
// ============================================================
async function runAdd(config?: DeployConfig): Promise<void> {
  if (!config)
    config = await loadDeployConfig()

  if (!config.server.secret) {
    p.log.error(c.red('请先运行 ninesh deploy init 初始化配置'))
    return
  }

  p.intro(c.green('ninesh deploy add'))

  // 收集必要信息
  const projectInfo = await p.group({
    name: () => p.text({
      message: '项目名称 (用于匹配 GitHub webhook)',
      placeholder: 'ajiu9.cn',
      validate: (value) => {
        if (!value.trim())
          return '请输入项目名称'
        if (config!.projects.some(p => p.name === value))
          return '该项目名称已存在'
      },
    }),
    gitUrl: () => p.text({
      message: 'Git 仓库地址',
      placeholder: 'https://github.com/ajiu9/ajiu9.cn.git',
      validate: (value) => {
        if (!value.trim())
          return '请输入 Git 仓库地址'
      },
    }),
    branch: () => p.text({
      message: '分支名',
      placeholder: 'main',
      initialValue: 'main',
    }),
  }, {
    onCancel: () => {
      p.cancel('已取消')
      process.exit(0)
    },
  })

  // 从 gitUrl 推断默认值
  const gitUrl = projectInfo.gitUrl
  const repoName = gitUrl.split('/').pop()?.replace('.git', '') || projectInfo.name
  const gitHost = gitUrl.match(/github\.com/) ? 'github.com' : 'git.example.com'
  const owner = gitUrl.split('/').slice(-2)[0] || 'user'

  const defaultSourceDir = `/root/Code/${gitHost}/${owner}/${repoName}`
  const defaultTargetDir = `/usr/share/nginx/html/${repoName}`

  // 显示默认值摘要，让用户确认
  p.log.info(c.cyan('\n项目配置预览:'))

  const details = await p.group({
    sourceDir: () => p.text({
      message: '服务器代码目录',
      placeholder: defaultSourceDir,
      initialValue: defaultSourceDir,
    }),
    targetDir: () => p.text({
      message: '部署目标目录',
      placeholder: defaultTargetDir,
      initialValue: defaultTargetDir,
    }),
    buildOutput: () => p.text({
      message: '构建产物目录',
      placeholder: 'dist',
      initialValue: 'dist',
    }),
  }, {
    onCancel: () => {
      p.cancel('已取消')
      process.exit(0)
    },
  })

  // 显示完整配置
  console.log()
  console.log(c.dim('─────────────────────────────────'))
  console.log(`  ${c.bold('名称')}:     ${projectInfo.name}`)
  console.log(`  ${c.bold('Git URL')}: ${projectInfo.gitUrl}`)
  console.log(`  ${c.bold('分支')}:     ${projectInfo.branch}`)
  console.log(`  ${c.bold('源目录')}:   ${details.sourceDir}`)
  console.log(`  ${c.bold('目标目录')}: ${details.targetDir}`)
  console.log(`  ${c.bold('构建产物')}: ${details.buildOutput}`)
  console.log(c.dim('─────────────────────────────────'))

  const confirmed = await p.confirm({
    message: '确认添加此项目？',
    initialValue: true,
  })

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro(c.yellow('已取消'))
    return
  }

  const newProject: DeployProjectConfig = {
    name: projectInfo.name,
    sourceDir: details.sourceDir,
    targetDir: details.targetDir,
    buildOutput: details.buildOutput,
    gitUrl: projectInfo.gitUrl,
    branch: projectInfo.branch,
  }

  config.projects.push(newProject)
  await saveDeployConfig(config)

  p.log.success(c.green(`项目 "${projectInfo.name}" 已添加`))
  p.outro(c.dim(`配置文件: ${c.cyan('~/.ninesh/deploy.json')}`))
}

// ============================================================
// list
// ============================================================
async function runList(): Promise<void> {
  const config = await loadDeployConfig()

  if (config.projects.length === 0) {
    p.log.info(c.yellow('暂无配置的项目'))
    p.log.info(`运行 ${c.cyan('ninesh deploy add')} 添加项目`)
    return
  }

  p.intro(c.green('ninesh deploy list'))

  // 表头
  const headers = ['名称', '目标目录', '分支']
  const rows = config.projects.map(p => [p.name, p.targetDir, p.branch])

  // 计算列宽
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => r[i].length)),
  )

  // 打印表格
  const border = '─'.repeat(colWidths.reduce((a, b) => a + b + 3, 0))
  const formatRow = (row: string[]) =>
    `│ ${row.map((cell, i) => cell.padEnd(colWidths[i])).join(' │ ')} │`

  console.log(c.dim(`┌${border}┐`))
  console.log(c.bold(formatRow(headers)))
  console.log(c.dim(`├${border}┤`))
  rows.forEach((row) => {
    console.log(formatRow(row))
  })
  console.log(c.dim(`└${border}┘`))

  p.log.info(c.dim(`共 ${config.projects.length} 个项目`))
}

// ============================================================
// remove
// ============================================================
async function runRemove(name?: string): Promise<void> {
  const config = await loadDeployConfig()

  if (config.projects.length === 0) {
    p.log.error(c.red('暂无配置的项目'))
    return
  }

  if (!name) {
    // 选择要删除的项目
    const selected = await p.select({
      message: '选择要移除的项目',
      options: config.projects.map(p => ({
        value: p.name,
        label: `${p.name} → ${p.targetDir}`,
      })),
    })

    if (p.isCancel(selected)) {
      p.cancel('已取消')
      return
    }
    name = selected as string
  }

  const projectIndex = config.projects.findIndex(p => p.name === name)
  if (projectIndex === -1) {
    p.log.error(c.red(`项目 "${name}" 不存在`))
    return
  }

  const confirmed = await p.confirm({
    message: `确认移除项目 "${name}"？`,
    initialValue: false,
  })

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro(c.yellow('已取消'))
    return
  }

  config.projects.splice(projectIndex, 1)
  await saveDeployConfig(config)

  p.log.success(c.green(`项目 "${name}" 已移除`))
  p.log.info(c.dim('注意: 源码和部署目录未被删除'))
}

// ============================================================
// start
// ============================================================
async function runStart(): Promise<void> {
  const config = await loadDeployConfig()

  if (!config.server.secret) {
    p.log.error(c.red('请先运行 ninesh deploy init 初始化配置'))
    return
  }

  if (config.projects.length === 0) {
    p.log.error(c.red('暂无配置的项目'))
    p.log.info(`运行 ${c.cyan('ninesh deploy add')} 添加项目`)
    return
  }

  p.intro(c.green('ninesh deploy start'))
  p.log.info(`服务端口: ${c.cyan(String(config.server.port))}`)
  p.log.info(`Webhook 路径: ${c.cyan(config.server.path)}`)
  p.log.info(`已配置项目: ${c.cyan(String(config.projects.length))} 个`)

  // 检查并安装依赖
  const installed = await ensurePackages(['github-webhook-handler'])
  if (!installed) {
    p.log.error(c.red('缺少必要依赖，无法启动服务'))
    return
  }

  // 从 CWD 动态导入 github-webhook-handler（确保与 ensurePackages 安装位置一致）
  const { default: createHandler } = await importFromCWD('github-webhook-handler')

  const handler = createHandler({
    path: config.server.path,
    secret: config.server.secret,
  })

  const server = http.createServer((req, res) => {
    handler(req, res, () => {
      res.statusCode = 404
      res.end('No such location')
    })
  })

  handler.on('error', (err: Error) => {
    p.log.error(c.red(`Webhook 错误: ${err.message}`))
  })

  handler.on('push', async (event: any) => {
    const { repository, ref } = event.payload
    const name = repository.name

    p.log.info(c.cyan(`收到 push: ${name} → ${ref}`))

    // 查找项目配置
    const project = config.projects.find(p => p.name === name)

    if (!project) {
      p.log.warn(c.yellow(`项目 "${name}" 未配置，跳过`))
      return
    }

    // 验证分支
    const expectedRef = `refs/heads/${project.branch}`
    if (ref !== expectedRef) {
      p.log.info(c.dim(`分支不匹配: ${ref} !== ${expectedRef}，跳过`))
      return
    }

    // 执行部署
    await deployProject(project)
  })

  server.listen(config.server.port, () => {
    p.log.success(c.green(`Webhook 服务已启动: http://0.0.0.0:${config.server.port}${config.server.path}`))
  })
}

// ============================================================
// 部署逻辑
// ============================================================
async function deployProject(project: DeployProjectConfig): Promise<void> {
  p.log.step(c.cyan(`开始部署: ${project.name}`))

  try {
    // 检查源目录是否存在
    if (!existsSync(project.sourceDir)) {
      p.log.info(c.dim(`源目录不存在，执行 clone: ${project.sourceDir}`))

      // 确保父目录存在
      await fs.ensureDir(path.dirname(project.sourceDir))

      // clone 仓库
      await execa('git', [
        'clone',
        '-b', project.branch,
        project.gitUrl,
        project.sourceDir,
      ], { stdio: 'inherit' })
    }
    else {
      p.log.info(c.dim(`源目录已存在，执行 pull: ${project.sourceDir}`))

      // reset + pull
      await execa('git', ['reset', '--hard'], { cwd: project.sourceDir, stdio: 'inherit' })
      await execa('git', ['clean', '-df'], { cwd: project.sourceDir, stdio: 'inherit' })
      await execa('git', ['pull'], { cwd: project.sourceDir, stdio: 'inherit' })
    }

    // 检查构建产物是否存在
    const buildPath = path.join(project.sourceDir, project.buildOutput)
    if (!existsSync(buildPath)) {
      p.log.error(c.red(`构建产物不存在: ${buildPath}`))
      p.log.error(c.red('请确保 GitHub Actions 已构建并提交到仓库'))
      return
    }

    // 复制到目标目录
    p.log.info(c.dim(`复制到目标目录: ${project.targetDir}`))

    // 确保目标目录的父目录存在
    await fs.ensureDir(path.dirname(project.targetDir))

    // 删除旧的目标目录
    if (existsSync(project.targetDir))
      await fs.remove(project.targetDir)

    // 复制新文件
    await fs.copy(buildPath, project.targetDir)

    p.log.success(c.green(`部署成功: ${project.name}`))
  }
  catch (error) {
    p.log.error(c.red(`部署失败: ${project.name}`))
    console.error(error)
  }
}

// ============================================================
// 入口
// ============================================================
export interface DeployArgs {
  action?: string
  name?: string
}

export async function run(args: ArgumentsCamelCase<DeployArgs>): Promise<void> {
  const action = args.action || 'list'

  switch (action) {
    case 'init':
      await runInit()
      break
    case 'add':
      await runAdd()
      break
    case 'list':
      await runList()
      break
    case 'remove':
      await runRemove(args.name)
      break
    case 'start':
      await runStart()
      break
    default:
      p.log.error(c.red(`未知操作: ${action}`))
      p.log.info(`可用操作: ${c.cyan('init')}, ${c.cyan('add')}, ${c.cyan('list')}, ${c.cyan('remove')}, ${c.cyan('start')}`)
      break
  }
}
