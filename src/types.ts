export type Difficulty = 'easy' | 'medium' | 'hard'

interface QuestionBase {
  id: string
  category: string
  source?: { script: string; lines?: string }
  title: string
  description: string
  difficulty?: Difficulty
  tags?: string[]
  code: string
  hints: string[]
  explanation?: string
  related_reference?: string[]
}

export interface Blank {
  id: string
  answers: string[]
  accepted_patterns?: string[]
  placeholder?: string
  multiline?: boolean
}

export interface CodeError {
  line: number
  fixes: string[]
  explanation?: string
}

export interface FillBlankQuestion extends QuestionBase {
  type: 'fill_blank'
  blanks: Blank[]
}

export interface FindFixQuestion extends QuestionBase {
  type: 'find_fix'
  errors: CodeError[]
}

export type Question = FillBlankQuestion | FindFixQuestion

export interface Manifest {
  /** Paths relative to /data/. Both .json (array) and .jsonl are supported. */
  questionFiles: string[]
  reference: string
}

export interface RefParameter {
  name: string
  type?: string
  default?: string
  description: string
}

export interface RefEntry {
  name: string
  aliases?: string[]
  kind: string
  module?: string
  signature?: string
  summary: string
  parameters?: RefParameter[]
  returns?: string
  example?: string
  notes?: string[]
  see_also?: string[]
  tags?: string[]
}

export interface ReferenceFile {
  version?: string
  entries: RefEntry[]
}
