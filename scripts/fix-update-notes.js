const fs = require('fs')

const notesPath = 'resources/update-notes.json'
let notesContent = fs.readFileSync(notesPath, 'utf-8')

// Replace Chinese quotation marks (U+201C and U+201D) with escaped English quotes
const leftQuote = String.fromCharCode(0x201c)
const rightQuote = String.fromCharCode(0x201d)
notesContent = notesContent.split(leftQuote).join('\\"').split(rightQuote).join('\\"')

const notes = JSON.parse(notesContent)
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))

const today = new Date().toISOString().split('T')[0]
notes.versions.unshift({
  version: pkg.version,
  date: today,
  highlights: {
    'zh-CN': ['CI Build - CI 自动构建版本'],
    'en-US': ['CI Build - Automated CI build']
  }
})

fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2))
console.log('Added release notes for version:', pkg.version)
