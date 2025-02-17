import { AtomCache, __root } from '@reatom/core'

export const logGraph = (logsSet: Set<AtomCache>) => {
  const visited = new Set<AtomCache>()
  const checkCause = (patch: AtomCache) => {
    if (
      patch.cause &&
      patch.cause.proto !== __root &&
      (!patch.cause.proto.name!.startsWith('_') ||
        !patch.cause.proto.name!.includes('._')) &&
      !logsSet.has(patch.cause) &&
      !visited.has(patch.cause)
    ) {
      checkCause(patch.cause)
      visited.add(patch.cause)
    }
  }
  for (const patch of logsSet) checkCause(patch)
  const logs = [...logsSet]
  const r = 10
  const xGap = r * 2
  const yGap = r * 3
  const maxDistance = logs.reduce(
    (acc, patch, i) =>
      Math.max(acc, i - ((patch.cause && logs.indexOf(patch.cause)) ?? i)),
    0,
  )
  const shiftRatio = maxDistance * xGap
  const maxShift = Math.floor((maxDistance / logs.length) * shiftRatio)

  const x = maxShift + xGap
  let y = yGap
  let body = ''
  let width = x

  for (const patch of logs) {
    // if (!patch.cause) continue;
    const { isAction, name } = patch.proto
    const color = isAction
      ? name!.endsWith('.onFulfill')
        ? '#E6DC73'
        : '#ffff80'
      : '#151134'
    body += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" />`
    body += `<text x="${x + r * 1.5}" y="${
      y + r / 2
    }" font-size="${r}" fill="gray">${name}</text>`
    y += yGap
    width = Math.max(width, x + name!.length * r)
  }

  logs.forEach(({ cause }, idx) => {
    if (!cause || cause.proto === __root || idx === 0) return

    const causeIdx = logs.indexOf(cause)
    if (causeIdx < 0) return
    const causeY = causeIdx * yGap + yGap
    const shift = (idx - causeIdx) / logs.length
    const shiftX = Math.floor(x - shift * shiftRatio - xGap / 2)
    const shiftY = Math.floor((causeIdx + (idx - causeIdx) / 2) * yGap) + yGap
    const idxY = idx * yGap + yGap
    const lineX = Math.floor(x - xGap / 2)

    const start = `${lineX},${causeY}`
    const middle = `${shiftX},${shiftY}`
    const end = `${lineX},${idxY}`

    body += `<polyline points="${start} ${middle} ${end}" stroke="gray" fill="none" />`
  })

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" style="font-family: monospace;">${body}</svg>`

  const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`
  const bgUrl = `url(${dataUrl})`
  console.log(
    '%c                         ',
    `font-size:${y}px; background: ${bgUrl} no-repeat; font-family: monospace;`,
  )
}
