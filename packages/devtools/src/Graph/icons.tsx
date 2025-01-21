import { h, hf, JSX, css } from '@reatom/jsx'

const toUrlString = (icon: JSX.Element) => `url(data:image/svg+xml;base64,${btoa((<div>{icon}</div>).innerHTML)})`

export const matchIconElement = (
  <svg:svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <svg:path d="M 3 6 H 13" stroke="black" stroke-width="1.5" stroke-linecap="round" />
    <svg:path d="M 3 10 H 13" stroke="black" stroke-width="1.5" stroke-linecap="round" />
  </svg:svg>
)
export const matchIcon = toUrlString(matchIconElement)

export const notMatchIconElement /* ("≠") */ = (
  <svg:svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <svg:path d="M 3 6 H 13" stroke="black" stroke-width="1.5" stroke-linecap="round" />
    <svg:path d="M 3 10 H 13" stroke="black" stroke-width="1.5" stroke-linecap="round" />
    <svg:path d="M 4 14 L 12 2" stroke="black" stroke-width="1.5" stroke-linecap="round" />
  </svg:svg>
)
export const notMatchIcon = toUrlString(notMatchIconElement)

export const excludeIconElement = (
  <svg:svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <svg:path d="M 1 8 L 8 1 L 15 8 L 8 15 L 1 8" stroke="black" stroke-width="1.5" stroke-linecap="round" />
    <svg:path d="M 6 6 L 10 10" stroke="black" stroke-width="1.5" stroke-linecap="round" />
    <svg:path d="M 6 10 L 10 6" stroke="black" stroke-width="1.5" stroke-linecap="round" />
  </svg:svg>
)
export const excludeIcon = toUrlString(excludeIconElement)

export const stopIconElement = (
  <svg:svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <svg:path d="M 6 8 H 10" stroke="black" stroke-width="2" stroke-linecap="round" />
    <svg:circle cx="8" cy="8" r="6" stroke="black" stroke-width="1.5" />
  </svg:svg>
)
export const stopIcon = toUrlString(stopIconElement)

export const removeIconElement = (
  <svg:svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <svg:path d="M 4 4 L 12 12" stroke="black" stroke-width="1.5" stroke-linecap="round" />
    <svg:path d="M 4 12 L 12 4" stroke="black" stroke-width="1.5" stroke-linecap="round" />
  </svg:svg>
)
export const removeIcon = toUrlString(removeIconElement)
