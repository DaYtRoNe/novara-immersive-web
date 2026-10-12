export type Corner = 'tl' | 'tr' | 'br' | 'bl'

/**
 * CSS clip-path polygon for a rectangle with chamfered corners.
 * `cut` accepts any CSS length, so shapes stay crisp at every size.
 */
export function cornerCutPolygon(corners: Corner[], cut = '12px') {
  const has = (c: Corner) => corners.includes(c)
  const points = [
    ...(has('tl') ? [`0 ${cut}`, `${cut} 0`] : ['0 0']),
    ...(has('tr') ? [`calc(100% - ${cut}) 0`, `100% ${cut}`] : ['100% 0']),
    ...(has('br') ? [`100% calc(100% - ${cut})`, `calc(100% - ${cut}) 100%`] : ['100% 100%']),
    ...(has('bl') ? [`${cut} 100%`, `0 calc(100% - ${cut})`] : ['0 100%']),
  ]
  return `polygon(${points.join(', ')})`
}
