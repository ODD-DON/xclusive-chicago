import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"

interface NumberInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function NumberInput({ id, label, value, onChange }: NumberInputProps) {
  const MIN = 0
  const MAX = 10

  const handleIncrement = () => {
    const currentValue = parseInt(value) || MIN
    if (currentValue < MAX) {
      onChange((currentValue + 1).toString())
    }
  }

  const handleDecrement = () => {
    const currentValue = parseInt(value) || MIN
    if (currentValue > MIN) {
      onChange((currentValue - 1).toString())
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const newValue = e.target.value.replace(/[^\d]/g, '')
    
    if (newValue === "") {
      onChange(MIN.toString())
      return
    }

    const numValue = parseInt(newValue)
    if (!isNaN(numValue)) {
      // Ensure the value stays within bounds
      if (numValue > MAX) {
        onChange(MAX.toString())
      } else if (numValue < MIN) {
        onChange(MIN.toString())
      } else {
        onChange(numValue.toString())
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, and numbers
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key) ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()) && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      ['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)
    ) {
      return
    }

    // Block any key that isn't a number
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center space-x-2 mt-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          className="h-10 w-10"
        >
          -
        </Button>
        <Input
          id={id}
          type="number"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="text-center"
          min={MIN}
          max={MAX}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          className="h-10 w-10"
        >
          +
        </Button>
      </div>
    </div>
  )
} 