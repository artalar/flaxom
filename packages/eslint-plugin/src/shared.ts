import type * as estree from 'estree'

export const reatomFactoryList = ['atom', 'action', 'reaction'] as const
export const reatomFactoryPattern = new RegExp(`^(reatom\\w+|${reatomFactoryList.join('|')})$`)

export const patternNames = (pattern: estree.Pattern | null): estree.Identifier[] => {
  if (!pattern) {
    return []
  }

  if (pattern.type === 'AssignmentPattern') {
    return patternNames(pattern.left)
  }
  if (pattern.type === 'Identifier') {
    return [pattern]
  }
  if (pattern.type === 'ArrayPattern') {
    return pattern.elements.flatMap(patternNames)
  }

  if (pattern.type === 'ObjectPattern') {
    return pattern.properties.flatMap((property) =>
      property.type === 'Property' && property.key.type === 'Identifier' ? property.key : [],
    )
  }
  return []
}
