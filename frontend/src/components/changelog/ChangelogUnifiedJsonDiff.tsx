import { diffLines } from 'diff'

type ChangelogUnifiedJsonDiffProps = {
  oldText: string
  newText: string
}

function normalizeNewlines(s: string) {
  return s.replace(/\r\n/g, '\n')
}

function chunkToLines(value: string): string[] {
  const v = normalizeNewlines(value)
  if (v === '') {
    return []
  }
  const withoutTrailingNl = v.endsWith('\n') ? v.slice(0, -1) : v
  return withoutTrailingNl.split('\n')
}

export function ChangelogUnifiedJsonDiff({ oldText, newText }: ChangelogUnifiedJsonDiffProps) {
  const hunks = diffLines(oldText, newText, { newlineIsToken: false })

  let lineKey = 0

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Unified diff: <span className="text-red-700">removed</span>,{' '}
        <span className="text-green-700">added</span>, unchanged lines for context.
      </p>
      <div className="max-h-96 overflow-auto rounded-md border border-gray-200 bg-white font-mono text-xs leading-snug">
        {hunks.flatMap((part) => {
          const lines = chunkToLines(part.value)
          if (lines.length === 0 && part.value.length > 0) {
            return []
          }
          return lines.map((line) => {
            const key = lineKey++
            if (part.added) {
              return (
                <div
                  key={key}
                  className="whitespace-pre-wrap break-all border-l-4 border-green-500 bg-green-50 pl-2 pr-2 py-0.5 text-green-900"
                >
                  <span className="inline-block w-3 select-none font-bold text-green-600">+</span>
                  {line}
                </div>
              )
            }
            if (part.removed) {
              return (
                <div
                  key={key}
                  className="whitespace-pre-wrap break-all border-l-4 border-red-500 bg-red-50 pl-2 pr-2 py-0.5 text-red-900"
                >
                  <span className="inline-block w-3 select-none font-bold text-red-600">-</span>
                  {line}
                </div>
              )
            }
            return (
              <div
                key={key}
                className="whitespace-pre-wrap break-all border-l-4 border-transparent pl-2 pr-2 py-0.5 text-gray-700"
              >
                <span className="inline-block w-3 select-none text-gray-400"> </span>
                {line}
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}
