import type { Language } from '../types'

const tokenize = (text: string, language: Language): string[] => {
  const segmenter = new Intl.Segmenter(language, { granularity: 'word' })
  const tokens: string[] = []

  for (const { segment } of segmenter.segment(text.trim())) {
    if (/^\s+$/.test(segment)) {
      if (language === 'th' && tokens.length) tokens[tokens.length - 1] += segment
    } else if (/^[,.;:!?ๆฯ]+$/.test(segment) && tokens.length) {
      tokens[tokens.length - 1] += segment
    } else {
      tokens.push(segment)
    }
  }

  return tokens
}

const visualWidth = (text: string, language: Language): number => {
  const segmenter = new Intl.Segmenter(language, { granularity: 'grapheme' })
  let width = 0
  for (const { segment } of segmenter.segment(text.trim())) {
    if (/^\s+$/.test(segment)) width += 0.35
    else if (/^[A-Za-z0-9]$/.test(segment)) width += 0.62
    else if (/^[,.;:!?ๆฯ]$/.test(segment)) width += 0.45
    else width += 1
  }
  return width
}

const joinTokens = (tokens: string[], language: Language): string =>
  tokens.join(language === 'en' ? ' ' : '').replace(/\s+([,.;:!?])/g, '$1').trim()

const partition = (tokens: string[], lineCount: number, language: Language): string[] => {
  const totalWidth = visualWidth(joinTokens(tokens, language), language)
  const targetWidth = totalWidth / lineCount
  const memo = new Map<string, { cost: number; lines: string[] }>()

  const solve = (start: number, linesLeft: number): { cost: number; lines: string[] } => {
    const key = `${start}:${linesLeft}`
    const cached = memo.get(key)
    if (cached) return cached

    if (linesLeft === 1) {
      const line = joinTokens(tokens.slice(start), language)
      const result = { cost: Math.pow(visualWidth(line, language) - targetWidth, 2), lines: [line] }
      memo.set(key, result)
      return result
    }

    let best = { cost: Number.POSITIVE_INFINITY, lines: [] as string[] }
    const lastEnd = tokens.length - linesLeft + 1

    for (let end = start + 1; end <= lastEnd; end += 1) {
      const line = joinTokens(tokens.slice(start, end), language)
      const lineWidth = visualWidth(line, language)
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

export const balanceCardText = (text: string, language: Language = 'th'): string[] => {
  const tokens = tokenize(text, language)
  if (tokens.length <= 1) return [text.trim()]

  const width = visualWidth(text, language)
  const targetLineWidth = language === 'en' ? 12 : 15
  const requestedLines = Math.min(4, Math.max(1, Math.ceil(width / targetLineWidth)))
  const lineCount = Math.min(requestedLines, tokens.length)

  return partition(tokens, lineCount, language)
}
