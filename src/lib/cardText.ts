const WORD_SEGMENTER = new Intl.Segmenter('th', { granularity: 'word' })
const GRAPHEME_SEGMENTER = new Intl.Segmenter('th', { granularity: 'grapheme' })

const tokenize = (text: string): string[] => {
  const tokens: string[] = []

  for (const { segment } of WORD_SEGMENTER.segment(text.trim())) {
    if (/^\s+$/.test(segment)) {
      if (tokens.length) tokens[tokens.length - 1] += segment
    } else if (/^[,.;:!?ๆฯ]+$/.test(segment) && tokens.length) {
      tokens[tokens.length - 1] += segment
    } else {
      tokens.push(segment)
    }
  }

  return tokens
}

const visualWidth = (text: string): number => {
  let width = 0
  for (const { segment } of GRAPHEME_SEGMENTER.segment(text.trim())) {
    if (/^\s+$/.test(segment)) width += 0.35
    else if (/^[A-Za-z0-9]$/.test(segment)) width += 0.62
    else if (/^[,.;:!?ๆฯ]$/.test(segment)) width += 0.45
    else width += 1
  }
  return width
}

const partition = (tokens: string[], lineCount: number): string[] => {
  const totalWidth = visualWidth(tokens.join(''))
  const targetWidth = totalWidth / lineCount
  const memo = new Map<string, { cost: number; lines: string[] }>()

  const solve = (start: number, linesLeft: number): { cost: number; lines: string[] } => {
    const key = `${start}:${linesLeft}`
    const cached = memo.get(key)
    if (cached) return cached

    if (linesLeft === 1) {
      const line = tokens.slice(start).join('').trim()
      const result = { cost: Math.pow(visualWidth(line) - targetWidth, 2), lines: [line] }
      memo.set(key, result)
      return result
    }

    let best = { cost: Number.POSITIVE_INFINITY, lines: [] as string[] }
    const lastEnd = tokens.length - linesLeft + 1

    for (let end = start + 1; end <= lastEnd; end += 1) {
      const line = tokens.slice(start, end).join('').trim()
      const lineWidth = visualWidth(line)
      const remaining = solve(end, linesLeft - 1)
      const raggedness = Math.pow(lineWidth - targetWidth, 2)
      const overflowPenalty = lineWidth > targetWidth * 1.35
        ? Math.pow(lineWidth - targetWidth * 1.35, 2) * 6
        : 0
      const cost = raggedness + overflowPenalty + remaining.cost

      if (cost < best.cost) best = { cost, lines: [line, ...remaining.lines] }
    }

    memo.set(key, best)
    return best
  }

  return solve(0, lineCount).lines
}

export const balanceCardText = (text: string): string[] => {
  const tokens = tokenize(text)
  if (tokens.length <= 1) return [text.trim()]

  const width = visualWidth(text)
  const requestedLines = Math.min(4, Math.max(1, Math.ceil(width / 15)))
  const lineCount = Math.min(requestedLines, tokens.length)

  return partition(tokens, lineCount)
}
