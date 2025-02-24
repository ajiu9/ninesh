#!/usr/bin/env node

'use strict'

import { spawn } from 'node:child_process'
import process from 'node:process'

spawn('ssh',
  [
    '-o', 'StrictHostKeyChecking=no',
  ]
    .concat(process.argv.slice(2)),
  { stdio: 'inherit' })
