import { JSX } from '@reatom/jsx'

const toUrlString = (icon: JSX.Element) => `url(data:image/svg+xml;base64,${btoa(icon.outerHTML)})`

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

export const paintIconBucketElement = (
  <svg:svg
    xmlns="http://www.w3.org/2000/svg"
    fill="#000000"
    height="16px"
    width="16px"
    version="1.1"
    viewBox="0 0 488.4 488.4"
  >
    <svg:g>
      <svg:path d="M461.2,85.5c0-58.4-112.7-85.5-217-85.5s-217,26.1-217,84.5c0,0.2,0,318.7,0,318.7c0,58.2,112.1,85.2,216,85.2   c100.8,0,209.3-25.4,217.5-80.1c0.3-1.3,0.5-2.6,0.5-4V85.5C461.2,85.6,461.2,85.5,461.2,85.5z M419.6,403.2L419.6,403.2   c0,13.5-61.3,44.6-175.4,44.6S68.8,415.7,68.8,403.2V137.5c10.9,5.7,23.5,10.6,37.4,14.8v104.6c0,11.4,9.3,20.8,20.8,20.8   s20.8-9.3,20.8-19.7v-95.9c12.4,2.2,25.3,3.9,38.4,5.2v53.3c0,11.4,9.3,20.8,20.8,20.8c11.4,0,20.8-9.3,20.8-20.8v-50.7   c5.5,0.2,11.1,0.2,16.6,0.2c8.3,0,16.6-0.2,24.9-0.5v99.8c0,11.4,9.3,20.8,20.8,20.8s20.8-8.3,20.8-19.7v-104   c42.1-4.7,81.2-14,109-28.3v265H419.6z M244.2,130.4c-114.7,0-176.3-31.3-176.3-44.9s62.6-44.8,176.3-44.8S420.5,72,420.5,85.6   S358.9,130.4,244.2,130.4z" />
    </svg:g>
  </svg:svg>
)
export const paintIconBucket = toUrlString(paintIconBucketElement)
