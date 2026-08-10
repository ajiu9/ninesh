#!/usr/bin/env node
/**
 * 模拟 GitHub Webhook 请求
 * 用于测试 ninesh deploy 服务
 *
 * 使用方法:
 *   node scripts/test-webhook.js <项目名> [分支]
 *
 * 环境变量:
 *   SECRET - webhook 密钥 (必需)
 *   PORT - 服务端口 (默认 3000)
 *
 * 示例:
 *   SECRET=testCercert node scripts/test-webhook.js ajiu9.cn main
 */

import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import http from 'node:http'
import process from 'node:process'

// 从环境变量读取配置
const PORT = Number.parseInt(process.env.PORT || '3000', 10)
const SECRET = process.env.SECRET || ''

if (!SECRET) {
  console.error('✗ 错误: 未设置 SECRET 环境变量')
  console.error('\n使用方法:')
  console.error('  SECRET=your-secret node scripts/test-webhook.js <项目名> [分支]')
  process.exit(1)
}

// 从命令行参数获取
const projectName = process.argv[2] || 'ajiu9.cn'
const branch = process.argv[3] || 'main'

// 构造 payload
const payload = {
  ref: `refs/heads/${branch}`,
  repository: {
    name: projectName,
    full_name: `ajiu9/${projectName}`,
    html_url: `https://github.com/ajiu9/${projectName}`,
  },
  pusher: {
    name: 'test-user',
    email: 'test@example.com',
  },
  commits: [
    {
      id: 'abc123',
      message: 'Test commit',
      timestamp: new Date().toISOString(),
    },
  ],
}

// 计算签名
const payloadString = JSON.stringify(payload)
const signature = crypto
  .createHmac('sha1', SECRET)
  .update(payloadString)
  .digest('hex')

// 发送请求
const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/webhooks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'push',
    'X-GitHub-Delivery': crypto.randomUUID(),
    'X-Hub-Signature': `sha1=${signature}`,
    'Content-Length': Buffer.byteLength(payloadString),
  },
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('模拟 GitHub Webhook 请求')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`项目: ${projectName}`)
console.log(`分支: ${branch}`)
console.log(`URL: http://localhost:${PORT}/webhooks`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const req = http.request(options, (res) => {
  console.log(`响应状态: ${res.statusCode}`)
  console.log(`响应头: ${JSON.stringify(res.headers)}\n`)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log(`响应内容: ${data}`)
    console.log('\n✓ 测试完成')
  })
})

req.on('error', (error) => {
  console.error('✗ 请求失败:', error.message || error.code || '未知错误')
  console.error('\n请确保:')
  console.error('1. 已运行 ninesh deploy init 初始化配置')
  console.error('2. 已运行 ninesh deploy start 启动服务')
  console.error('3. 已添加测试项目到配置')
  console.error('4. 端口号正确 (当前:', PORT, ')')
  process.exit(1)
})

req.write(payloadString)
req.end()
