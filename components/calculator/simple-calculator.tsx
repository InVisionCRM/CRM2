"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface SimpleCalculatorProps {
  onClose: () => void
}

export function SimpleCalculator({ onClose }: SimpleCalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [firstOperand, setFirstOperand] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false)

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit)
      setWaitingForSecondOperand(false)
    } else {
      setDisplay(display === "0" ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay("0.")
      setWaitingForSecondOperand(false)
      return
    }

    if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }

  const clearDisplay = () => {
    setDisplay("0")
    setFirstOperand(null)
    setOperator(null)
    setWaitingForSecondOperand(false)
  }

  const performOperation = (nextOperator: string) => {
    const inputValue = Number.parseFloat(display)

    if (firstOperand === null) {
      setFirstOperand(inputValue)
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator)
      setDisplay(String(result))
      setFirstOperand(result)
    }

    setWaitingForSecondOperand(true)
    setOperator(nextOperator)
  }

  const calculate = (firstOperand: number, secondOperand: number, operator: string) => {
    switch (operator) {
      case "+":
        return firstOperand + secondOperand
      case "-":
        return firstOperand - secondOperand
      case "*":
        return firstOperand * secondOperand
      case "/":
        return firstOperand / secondOperand
      default:
        return secondOperand
    }
  }

  const handleEquals = () => {
    if (firstOperand === null || operator === null) {
      return
    }

    const inputValue = Number.parseFloat(display)
    const result = calculate(firstOperand, inputValue, operator)
    setDisplay(String(result))
    setFirstOperand(result)
    setOperator(null)
    setWaitingForSecondOperand(true)
  }

  const handleBackspace = () => {
    if (display.length === 1 || (display.length === 2 && display.startsWith("-"))) {
      setDisplay("0")
    } else {
      setDisplay(display.slice(0, -1))
    }
  }

  const handlePlusMinus = () => {
    const value = Number.parseFloat(display)
    setDisplay(String(-value))
  }

  const handlePercent = () => {
    const value = Number.parseFloat(display)
    setDisplay(String(value / 100))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Calculator</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              value={display}
              readOnly
              className="text-right text-2xl h-12 font-mono"
              aria-label="Calculator display"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" onClick={clearDisplay}>
              C
            </Button>
            <Button variant="outline" onClick={handleBackspace}>
              ⌫
            </Button>
            <Button variant="outline" onClick={handlePercent}>
              %
            </Button>
            <Button variant="outline" onClick={() => performOperation("/")}>
              ÷
            </Button>

            <Button variant="outline" onClick={() => inputDigit("7")}>
              7
            </Button>
            <Button variant="outline" onClick={() => inputDigit("8")}>
              8
            </Button>
            <Button variant="outline" onClick={() => inputDigit("9")}>
              9
            </Button>
            <Button variant="outline" onClick={() => performOperation("*")}>
              ×
            </Button>

            <Button variant="outline" onClick={() => inputDigit("4")}>
              4
            </Button>
            <Button variant="outline" onClick={() => inputDigit("5")}>
              5
            </Button>
            <Button variant="outline" onClick={() => inputDigit("6")}>
              6
            </Button>
            <Button variant="outline" onClick={() => performOperation("-")}>
              -
            </Button>

            <Button variant="outline" onClick={() => inputDigit("1")}>
              1
            </Button>
            <Button variant="outline" onClick={() => inputDigit("2")}>
              2
            </Button>
            <Button variant="outline" onClick={() => inputDigit("3")}>
              3
            </Button>
            <Button variant="outline" onClick={() => performOperation("+")}>
              +
            </Button>

            <Button variant="outline" onClick={handlePlusMinus}>
              ±
            </Button>
            <Button variant="outline" onClick={() => inputDigit("0")}>
              0
            </Button>
            <Button variant="outline" onClick={inputDecimal}>
              .
            </Button>
            <Button onClick={handleEquals} className="bg-primary text-primary-foreground">
              =
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
