import { nanoid } from 'nanoid'

export function generateWindowId(): string {
  return `win_${nanoid(8)}`
}
