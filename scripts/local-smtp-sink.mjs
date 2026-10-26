// Tiny SMTP sink for local development: accepts every message and writes it to
// .local/mail/<timestamp>.eml so password-reset links can be read in tests.
import net from 'node:net'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const dir = path.resolve(process.env.MAIL_DIR ?? '.local/mail')
mkdirSync(dir, { recursive: true })
const port = Number(process.env.SMTP_PORT ?? 2500)

net
  .createServer((socket) => {
    let data = false
    let buffer = ''
    let message = ''
    const reply = (line) => socket.write(line + '\r\n')
    reply('220 dukan-local ESMTP')
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      let idx
      while ((idx = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        if (data) {
          if (line === '.') {
            data = false
            writeFileSync(path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.eml`), message)
            message = ''
            reply('250 OK')
          } else {
            message += (line.startsWith('..') ? line.slice(1) : line) + '\n'
          }
          continue
        }
        const cmd = line.slice(0, 4).toUpperCase()
        if (cmd === 'EHLO' || cmd === 'HELO') reply('250-dukan-local\r\n250 AUTH PLAIN LOGIN')
        else if (cmd === 'AUTH') reply('235 OK')
        else if (cmd === 'DATA') {
          data = true
          reply('354 End with .')
        } else if (cmd === 'QUIT') {
          reply('221 Bye')
          socket.end()
        } else reply('250 OK')
      }
    })
    socket.on('error', () => {})
  })
  .listen(port, '127.0.0.1', () => console.log(`smtp sink on ${port} -> ${dir}`))
