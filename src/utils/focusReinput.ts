type EditableInput = HTMLInputElement | HTMLTextAreaElement

type ReinputState = {
  originalPlaceholder: string
  originalValue: string
  active: boolean
}

const states = new WeakMap<EditableInput, ReinputState>()

const skippedTypes = new Set([
  'button',
  'checkbox',
  'file',
  'hidden',
  'radio',
  'range',
  'reset',
  'submit'
])

export function installFocusReinput() {
  document.addEventListener('focusin', handleFocusIn, true)
  document.addEventListener('focusout', handleFocusOut, true)
}

function handleFocusIn(event: FocusEvent) {
  const input = resolveInput(event.target)
  if (!input || shouldSkip(input) || input.value === '') return

  const field = input.closest('.van-field')
  const originalPlaceholder = input.placeholder
  const originalValue = input.value

  states.set(input, {
    originalPlaceholder,
    originalValue,
    active: true
  })

  field?.classList.add('reinput-active')
  input.placeholder = input.type === 'password'
    ? originalPlaceholder || '已输入密码'
    : originalValue
  input.value = ''
  emitInput(input)
}

function handleFocusOut(event: FocusEvent) {
  const input = resolveInput(event.target)
  if (!input) return

  const state = states.get(input)
  if (!state?.active) return

  input.closest('.van-field')?.classList.remove('reinput-active')
  input.placeholder = state.originalPlaceholder

  if (input.value === '') {
    input.value = state.originalValue
    emitInput(input)
  }

  states.delete(input)
}

function resolveInput(target: EventTarget | null): EditableInput | null {
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
    return null
  }

  return target
}

function shouldSkip(input: EditableInput) {
  const field = input.closest('.van-field')
  if (!field || field.closest('.van-search')) return true
  if (input.disabled || input.readOnly) return true
  if (input.dataset.reinput === 'false' || field.getAttribute('data-reinput') === 'false') return true

  return input instanceof HTMLInputElement && skippedTypes.has(input.type)
}

function emitInput(input: EditableInput) {
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
