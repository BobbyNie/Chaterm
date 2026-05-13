const fs = require('fs')

const notesPath = 'resources/update-notes.json'
let content = fs.readFileSync(notesPath, 'utf-8')

// Parse JSON with a more lenient approach
// First, let's escape quotes within string values
// Pattern: find content between JSON structure quotes and escape internal quotes
let result = []
let inString = false
let escapeNext = false

for (let i = 0; i < content.length; i++) {
  const char = content[i]

  if (escapeNext) {
    result.push(char)
    escapeNext = false
    continue
  }

  if (char === '\\') {
    escapeNext = true
    result.push(char)
    continue
  }

  if (char === '"' && !inString) {
    // Start of JSON string
    inString = true
    result.push(char)
  } else if (char === '"' && inString) {
    // Could be end of string or internal quote
    // Look ahead to see if this is followed by comma, brace, bracket, or colon
    let nextNonSpace = null
    for (let j = i + 1; j < content.length && j < i + 20; j++) {
      if (content[j] !== ' ' && content[j] !== '\t' && content[j] !== '\n' && content[j] !== '\r') {
        nextNonSpace = content[j]
        break
      }
    }

    if (nextNonSpace === null || nextNonSpace === ',' || nextNonSpace === '}' || nextNonSpace === ']' || nextNonSpace === ':') {
      // This is end of JSON string
      inString = false
      result.push(char)
    } else {
      // This is an internal quote - escape it
      result.push('\\"')
    }
  } else {
    result.push(char)
  }
}

content = result.join('')

const notes = JSON.parse(content)
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
