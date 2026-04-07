# 自动检测系统默认终端需求文档

## 1. 背景与目标

### 背景
当前 ninesh 的 `init` 命令仅支持 zsh 配置，但不同操作系统的默认终端不同：
- macOS Catalina+ 默认使用 zsh
- Linux 发行版大多默认使用 bash
- 用户可能使用 fish、dash 等其他 shell

### 目标
实现自动检测系统默认终端，根据检测结果：
1. 提示用户当前默认终端
2. 智能推荐或自动配置对应的终端插件
3. 支持多终端配置管理

---

## 2. 功能需求

### 2.1 核心功能：终端检测

#### 检测逻辑优先级

```
1. 环境变量 $SHELL (最准确，用户实际使用的 shell)
2. /etc/passwd 中用户的 shell 字段
3. 系统默认 shell 回退方案
```

#### 支持检测的终端类型

| 终端 | 检测标识 | 配置文件路径 |
|------|----------|--------------|
| bash | `/bin/bash`, `/usr/bin/bash` | `~/.bashrc`, `~/.bash_profile` |
| zsh | `/bin/zsh`, `/usr/bin/zsh` | `~/.zshrc` |
| fish | `/bin/fish`, `/usr/bin/fish` | `~/.config/fish/config.fish` |
| dash | `/bin/dash` | `~/.profile` |
| sh | `/bin/sh` | `~/.profile` |

#### 检测结果返回

```typescript
interface ShellInfo {
  name: 'bash' | 'zsh' | 'fish' | 'dash' | 'sh' | 'unknown'
  path: string // e.g., "/bin/zsh"
  version: string // e.g., "5.8"
  configPath: string // e.g., "~/.zshrc"
  isDefault: boolean // 是否为系统默认
  isInstalled: boolean // 是否已安装
}
```

### 2.2 用户交互流程

#### 场景 A：检测到 zsh
```
✓ 检测到默认终端: zsh (v5.8)
✓ 配置文件: ~/.zshrc

选择要配置的功能:
  ○ 添加常用 zsh 插件
  ○ 添加 oh-my-zsh 插件
  ○ 配置 starship 提示符
  ○ 全部配置
```

#### 场景 B：检测到 bash
```
✓ 检测到默认终端: bash (v5.1)
✓ 配置文件: ~/.bashrc

⚠ 当前默认终端为 bash，建议切换到 zsh:
  - 更强大的自动补全
  - 更好的主题支持
  - 更丰富的插件生态

选择操作:
  ○ 继续配置 bash
  ○ 安装并切换到 zsh (推荐)
  ○ 取消
```

#### 场景 C：检测到其他终端
```
✓ 检测到默认终端: fish (v3.3)
✓ 配置文件: ~/.config/fish/config.fish

⚠ fish 支持有限，建议配置:
  ○ 继续配置 fish (基础支持)
  ○ 安装并切换到 zsh
  ○ 取消
```

### 2.3 多终端配置管理

#### 新增命令：`ninesh shell`

```bash
# 查看当前终端信息
ninesh shell

# 列出系统已安装的所有终端
ninesh shell list

# 切换默认终端
ninesh shell switch <shell-name>

# 安装终端
ninesh shell install <shell-name>
```

#### 命令输出示例

```bash
$ ninesh shell

当前终端信息:
  名称: zsh
  路径: /bin/zsh
  版本: 5.8
  配置: ~/.zshrc

已安装的终端:
  * zsh (当前默认)
    bash
    sh

$ ninesh shell list

已安装的终端:
  ◉ zsh      /bin/zsh      v5.8   (默认)
  ○ bash     /bin/bash     v5.1
  ○ sh       /bin/sh       -

可安装的终端:
  ○ fish     现代化 shell，语法友好
  ○ dash     轻量级 POSIX shell
```

---

## 3. 技术实现

### 3.1 目录结构

```
src/
├── app/
│   └── shell/
│       ├── index.ts          # 入口
│       ├── detect.ts         # 终端检测逻辑
│       ├── config.ts         # 配置文件管理
│       └── plugins/
│           ├── bash.ts       # bash 插件配置
│           ├── zsh.ts        # zsh 插件配置 (已有)
│           └── fish.ts       # fish 插件配置
└── utils/
    └── shell.ts              # 终端工具函数
```

### 3.2 检测实现

```typescript
// src/app/shell/detect.ts

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import process from 'node:process'

export interface ShellInfo {
  name: ShellType
  path: string
  version: string
  configPath: string
  isDefault: boolean
  isInstalled: boolean
}

type ShellType = 'bash' | 'zsh' | 'fish' | 'dash' | 'sh' | 'unknown'

const SHELL_CONFIG_MAP: Record<string, string[]> = {
  bash: ['~/.bashrc', '~/.bash_profile'],
  zsh: ['~/.zshrc'],
  fish: ['~/.config/fish/config.fish'],
  dash: ['~/.profile'],
  sh: ['~/.profile'],
}

export function detectDefaultShell(): ShellInfo {
  // 1. 从 $SHELL 环境变量获取
  const shellPath = process.env.SHELL || '/bin/sh'

  // 2. 解析终端名称
  const name = parseShellName(shellPath)

  // 3. 获取版本
  const version = getShellVersion(name)

  // 4. 确定配置文件路径
  const configPath = findConfigFile(name)

  return {
    name,
    path: shellPath,
    version,
    configPath,
    isDefault: true,
    isInstalled: true,
  }
}

function parseShellName(path: string): ShellType {
  const basename = path.split('/').pop() || ''
  const shellTypes: ShellType[] = ['bash', 'zsh', 'fish', 'dash', 'sh']

  return shellTypes.find(type => basename.includes(type)) || 'unknown'
}

function getShellVersion(name: ShellType): string {
  if (name === 'unknown') return ''

  try {
    const output = execSync(`${name} --version`, { encoding: 'utf-8' })
    const match = output.match(/version\s+(\d+\.\d+)/i)
    return match ? match[1] : ''
  }
  catch {
    return ''
  }
}

function findConfigFile(name: ShellType): string {
  const home = homedir()
  const configs = SHELL_CONFIG_MAP[name] || []

  for (const config of configs) {
    const fullPath = config.replace('~', home)
    if (existsSync(fullPath))
      return fullPath
  }

  // 返回默认配置路径
  return configs[0]?.replace('~', home) || ''
}

export function listInstalledShells(): ShellInfo[] {
  const shells: ShellType[] = ['bash', 'zsh', 'fish', 'dash', 'sh']
  const results: ShellInfo[] = []

  for (const shell of shells) {
    const paths = [`/bin/${shell}`, `/usr/bin/${shell}`]

    for (const path of paths) {
      if (existsSync(path)) {
        results.push({
          name: shell,
          path,
          version: getShellVersion(shell),
          configPath: findConfigFile(shell),
          isDefault: process.env.SHELL === path,
          isInstalled: true,
        })
        break
      }
    }
  }

  return results
}
```

### 3.3 CLI 命令注册

```typescript
// src/cli/index.ts 新增

.command(
  'shell [action] [target]',
  'Shell management - detect, list, switch terminals',
  (yargs: any) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        choices: ['info', 'list', 'switch', 'install'],
        default: 'info',
      })
      .positional('target', {
        describe: 'Target shell name (for switch/install)',
        type: 'string',
      })
  },
  async (args) => {
    header()
    const { run } = await import('../app/shell')
    await run(args)
  },
)
```

---

## 4. 配置文件更新

### 4.1 扩展配置结构

```typescript
// src/constants.ts

export interface ShellConfig {
  defaultShell: string
  installedShells: string[]
  lastChecked: string
}

export interface AppConfig {
  base: string[]
  hooks: Record<string, string>
  alias: Record<string, string>
  shell: ShellConfig // 新增
}
```

---

## 5. 兼容性矩阵

| 操作系统 | bash | zsh | fish | dash | sh |
|---------|------|-----|------|------|-----|
| macOS | ✅ | ✅ (默认) | ✅ | ❌ | ✅ |
| Ubuntu | ✅ (默认) | ✅ | ✅ | ✅ | ✅ |
| Debian | ✅ (默认) | ✅ | ✅ | ✅ | ✅ |
| CentOS/RHEL | ✅ (默认) | ✅ | ✅ | ❌ | ✅ |
| Arch Linux | ✅ (默认) | ✅ | ✅ | ✅ | ✅ |
| Windows | ⚠️ (Git Bash) | ⚠️ (WSL) | ❌ | ❌ | ❌ |

---

## 6. 用户体验优化

### 6.1 首次运行检测

```bash
$ ninesh init

✓ 检测到系统终端信息:
  默认终端: bash v5.1
  配置文件: ~/.bashrc

  可用终端: bash, zsh

⚠ ninesh 的完整功能需要 zsh 支持

选择操作:
  ○ 安装 zsh 并切换 (推荐)
  ○ 仅配置当前终端 (bash)
  ○ 跳过检测，使用旧版行为
```

### 6.2 智能提示

```bash
# 用户在 bash 下运行 zsh 专属命令
$ ninesh init -o

⚠ 当前终端为 bash，oh-my-zsh 仅支持 zsh

建议操作:
  1. 安装 zsh: sudo apt install zsh
  2. 切换终端: chsh -s $(which zsh)
  3. 重新运行: ninesh init -o
```

---

## 7. 后续扩展

### 7.1 Phase 2
- 支持自动安装 zsh (通过包管理器)
- 支持配置文件备份与恢复
- 支持多配置文件模板切换

### 7.2 Phase 3
- 支持终端主题管理
- 支持插件市场
- 支持配置同步到云端

---

## 8. 实现进度

### Todo List

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 1 | 创建 shell 检测模块目录结构 | `src/app/shell/` | ✅ 已完成 |
| 2 | 实现终端检测核心逻辑 | `src/app/shell/detect.ts` | ✅ 已完成 |
| 3 | 实现配置文件管理 | `src/app/shell/config.ts` | ✅ 已完成 |
| 4 | 实现 bash 插件配置支持 | `src/app/shell/plugins/bash.ts` | ✅ 已完成 |
| 5 | 实现 fish 插件配置支持 | `src/app/shell/plugins/fish.ts` | ✅ 已完成 |
| 6 | 实现 shell 命令入口 | `src/app/shell/index.ts` | ✅ 已完成 |
| 7 | 在 CLI 中注册 shell 命令 | `src/cli/index.ts` | ✅ 已完成 |
| 8 | 更新配置类型定义 | `src/constants.ts` | ✅ 已完成 |
| 9 | 更新 ninesh skill 文档 | `.claude/skills/ninesh.md` | ✅ 已完成 |

---

## 9. 测试用例

### 8.1 单元测试

```typescript
describe('detectDefaultShell', () => {
  it('should detect zsh on macOS', () => {
    process.env.SHELL = '/bin/zsh'
    const result = detectDefaultShell()
    expect(result.name).toBe('zsh')
  })

  it('should detect bash on Ubuntu', () => {
    process.env.SHELL = '/bin/bash'
    const result = detectDefaultShell()
    expect(result.name).toBe('bash')
  })
})
```

### 8.2 集成测试

```bash
# 测试不同环境下的检测
docker run -it ubuntu ninesh shell      # 应检测到 bash
docker run -it archlinux ninesh shell   # 应检测到 bash
# macOS 环境应检测到 zsh
```
