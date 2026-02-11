/**
 * Tokenizes a command string, respecting quoted strings and escapes.
 * Returns an array of tokens (arguments).
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let escaped = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]

    if (escaped) {
      current += ch
      escaped = false
      continue
    }

    if (ch === '\\' && !inSingle) {
      escaped = true
      continue
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }

    if (ch === ' ' && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += ch
  }

  if (current.length > 0) {
    tokens.push(current)
  }

  return tokens
}

export interface ParsedCommand {
  command: string
  args: string[]
  flags: Record<string, string | boolean>
}

/**
 * Parses a tokenized command into command name, positional args, and flags.
 * Supports --flag, --flag=value, -f (short flags).
 */
export function parseCommand(input: string): ParsedCommand {
  const tokens = tokenize(input.trim())
  if (tokens.length === 0) {
    return { command: '', args: [], flags: {} }
  }

  const command = tokens[0]
  const args: string[] = []
  const flags: Record<string, string | boolean> = {}

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=')
      if (eqIdx > 0) {
        flags[token.slice(2, eqIdx)] = token.slice(eqIdx + 1)
      } else {
        flags[token.slice(2)] = true
      }
    } else if (token.startsWith('-') && token.length > 1 && !token.startsWith('-', 1)) {
      // Short flags: -a -l -al
      for (const ch of token.slice(1)) {
        flags[ch] = true
      }
    } else {
      args.push(token)
    }
  }

  return { command, args, flags }
}
