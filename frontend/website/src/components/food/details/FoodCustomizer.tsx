'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Loader2, ShoppingCart } from 'lucide-react'
import QuantityStepper from '@/components/ui/QuantityStepper'
import { useCart } from '@/lib/cart/cart-context'
import { computeLineBreakdown } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'
import type { CartSelection, Food } from '@/types'

const INSTRUCTIONS_MAX = 200
const ADDING_DELAY = 420

interface FoodCustomizerProps {
  food: Food
  /** False when the selling restaurant is closed / no longer listing. */
  vendorAvailable: boolean
}

interface CustomizationGroupProps {
  groupName: string
  help: string
  requiredBadge: 'Required' | 'Optional'
  children: React.ReactNode
}

function CustomizationGroup({
  groupName,
  help,
  requiredBadge,
  children,
}: CustomizationGroupProps) {
  return (
    <section className="mt-7">
      <div className="mb-3.5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-extrabold text-[#171717]">{groupName}</h2>
          <p className="mt-0.5 text-[12px] text-[#78716c]">{help}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
            requiredBadge === 'Required'
              ? 'bg-[#fff1e6] text-[#ea580c]'
              : 'bg-[#f5f5f4] text-[#a8a29e]'
          }`}
        >
          {requiredBadge}
        </span>
      </div>
      {children}
    </section>
  )
}

export default function FoodCustomizer({ food, vendorAvailable }: FoodCustomizerProps) {
  const { addLine } = useCart()
  const groups = food.customizationGroups || []

  const [selections, setSelections] = useState<CartSelection[]>(
    groups.map((group) => ({ groupId: group.id, optionIds: [] }))
  )
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle')

  const breakdown = useMemo(
    () => computeLineBreakdown(food, selections, quantity),
    [food, selections, quantity]
  )

  const selectedCount = (groupId: string) =>
    selections.find((selection) => selection.groupId === groupId)?.optionIds.length || 0

  const toggleOption = (groupId: string, optionId: string, maxSelections: number) => {
    setStatus('idle')
    setValidationError(null)
    setSelections((prev) =>
      prev.map((selection) => {
        if (selection.groupId !== groupId) return selection
        const optionIds = selection.optionIds
        if (optionIds.includes(optionId)) {
          return { ...selection, optionIds: optionIds.filter((id) => id !== optionId) }
        }
        if (maxSelections === 1) {
          return { ...selection, optionIds: [optionId] }
        }
        if (optionIds.length >= maxSelections) {
          return selection
        }
        return { ...selection, optionIds: [...optionIds, optionId] }
      })
    )
  }

  const unavailable = food.available === false
  const canAdd = !unavailable && vendorAvailable

  const validate = (): string | null => {
    if (specialInstructions.trim().length > INSTRUCTIONS_MAX) {
      return `Please keep your instructions under ${INSTRUCTIONS_MAX} characters.`
    }
    for (const group of groups) {
      const count = selectedCount(group.id)
      const min = group.required ? Math.max(1, group.minSelections) : 0
      if (count < min) {
        return `Please choose at least ${min} option from "${group.name}".`
      }
      if (count > group.maxSelections) {
        return `${group.name} allows a maximum of ${group.maxSelections} selections.`
      }
    }
    return null
  }

  const handleAddToCart = () => {
    if (status === 'adding' || !canAdd) return
    setStatus('idle')
    const error = validate()
    if (error) {
      setValidationError(error)
      setStatus('idle')
      return
    }
    setValidationError(null)
    setStatus('adding')
    window.setTimeout(() => {
      addLine(food, {
        quantity,
        selections: selections.filter((selection) => selection.optionIds.length > 0),
        specialInstructions: specialInstructions.trim() || undefined,
      })
      setStatus('added')
    }, ADDING_DELAY)
  }

  const reset = () => {
    setStatus('idle')
    setQuantity(1)
    setSelections(groups.map((group) => ({ groupId: group.id, optionIds: [] })))
    setSpecialInstructions('')
    setValidationError(null)
  }

  return (
    <div>
      {/* ---- Unavailable food ---- */}
      {unavailable && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-[13px] font-bold text-[#b91c1c]">Sold out</p>
            <p className="mt-0.5 text-[12px] text-[#a3a3a3]">
              This meal is not available for ordering right now.
            </p>
          </div>
        </div>
      )}

      {/* ---- Restaurant closed ---- */}
      {!unavailable && !vendorAvailable && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-[13px] font-bold text-[#b45309]">Restaurant is currently closed</p>
            <p className="mt-0.5 text-[12px] text-[#a3a3a3]">
              You can still configure your meal and add it to your cart for later.
            </p>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-[#e5ddd5] bg-white px-5 py-4 text-[13px] text-[#78716c]">
          This meal is ready to order — no customization needed.
        </p>
      ) : (
        groups.map((group) => {
          const count = selectedCount(group.id)
          const min = group.required ? Math.max(1, group.minSelections) : 0
          const radio = group.maxSelections === 1
          const atMax = count >= group.maxSelections

          return (
            <CustomizationGroup
              key={group.id}
              groupName={group.name}
              help={
                group.required
                  ? `Select ${min} option${min > 1 ? 's' : ''}${group.maxSelections > 1 ? ` up to ${group.maxSelections}` : ''}`
                  : 'Optional'
              }
              requiredBadge={group.required ? 'Required' : 'Optional'}
            >
              <div
                role={radio ? 'radiogroup' : 'checkbox'}
                aria-label={group.name}
                className="grid gap-2.5"
              >
                {group.options.map((option) => {
                  const isSelected = Boolean(
                    selections
                      .find((selection) => selection.groupId === group.id)
                      ?.optionIds.includes(option.id)
                  )
                  const disabled = option.available === false
                  const full = !isSelected && !radio && atMax

                  return (
                    <label
                      key={option.id}
                      className={`relative flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border bg-white px-4 py-3.5 transition-colors duration-200 ${
                        isSelected
                          ? 'border-[#f97316] bg-[#fff1e6]'
                          : 'border-[#eee8e2] hover:border-[#fdba74] hover:bg-[#fffaf5]'
                      } ${disabled || full ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <input
                          type={radio ? 'radio' : 'checkbox'}
                          checked={isSelected}
                          disabled={disabled || full}
                          onChange={() => toggleOption(group.id, option.id, group.maxSelections)}
                          aria-label={option.name}
                          className="h-[17px] w-[17px] shrink-0 accent-[#f97316]"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-bold text-[#171717]">
                            {option.name}
                          </span>
                          {option.isDefault && (
                            <span className="mt-0.5 block text-[11px] text-[#78716c]">
                              Default option
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[13px] font-extrabold text-[#171717]">
                        {option.priceModifier > 0
                          ? `+${formatPrice(option.priceModifier)}`
                          : option.priceModifier < 0
                            ? `−${formatPrice(Math.abs(option.priceModifier))}`
                            : 'Included'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </CustomizationGroup>
          )
        })
      )}

      {/* ---- Special instructions ---- */}
      <section className="mt-7">
        <div className="mb-3.5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-extrabold text-[#171717]">
              Special instructions
            </h2>
            <p className="mt-0.5 text-[12px] text-[#78716c]">
              Tell the restaurant anything they should know
            </p>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#a8a29e]">
            Optional
          </span>
        </div>
        <textarea
          id="food-special-instructions"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value.slice(0, INSTRUCTIONS_MAX))}
          placeholder="Example: Please make it less spicy, add extra sauce..."
          maxLength={INSTRUCTIONS_MAX}
          rows={2}
          className="min-h-[96px] w-full resize-y rounded-[14px] border border-[#eee8e2] bg-white px-4 py-3.5 text-[13px] text-[#171717] outline-none transition-all duration-200 placeholder:text-[#bab5b0] focus:border-[#f97316] focus:ring-[3px] focus:ring-[#f97316]/10"
        />
        <p className="mt-1.5 text-right text-[11px] text-[#a8a29e]" aria-live="polite">
          {specialInstructions.length}/{INSTRUCTIONS_MAX}
        </p>
      </section>

      {/* ---- Order box ---- */}
      <div className="mt-7 rounded-[20px] border border-[#eee8e2] bg-white p-5 shadow-[0_8px_24px_rgba(38,27,18,0.05)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <div className="text-right">
            <span className="block text-[11px] text-[#78716c]">Total price</span>
            <strong className="text-[22px] font-extrabold text-[#171717]">
              {formatPrice(breakdown.lineTotal)}
            </strong>
            <span className="block text-[11px] text-[#a8a29e]">
              {formatPrice(breakdown.unitPrice)} × {quantity}
            </span>
          </div>
        </div>

        {status === 'added' ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-green-200 bg-green-50 p-4"
          >
            <p className="flex items-center gap-2 text-[14px] font-bold text-green-700">
              <Check className="h-[18px] w-[18px]" />
              Added to your cart
            </p>
            <p className="mt-1 text-[12px] text-[#666666]">
              {food.name} · {formatPrice(breakdown.lineTotal)}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Link
                href="/cart"
                className="rounded-xl bg-primary px-4 py-2.5 text-center text-[13px] font-extrabold text-white transition-colors hover:bg-primary-600"
              >
                View cart
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border-2 border-primary px-4 py-2.5 text-[13px] font-extrabold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Add another
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd || status === 'adding'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#f97316] px-5 py-4 text-[14px] font-extrabold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ea580c] hover:shadow-[0_10px_22px_rgba(249,115,22,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {status === 'adding' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding...
              </>
            ) : unavailable ? (
              'Currently unavailable'
            ) : !vendorAvailable ? (
              'Add to cart for later'
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                <span>Add to cart · {formatPrice(breakdown.lineTotal)}</span>
              </>
            )}
          </button>
        )}

        {/* Error feedback */}
        <div aria-live="assertive">
          {validationError && (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-red-600">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {validationError}
            </p>
          )}
        </div>

        <p className="mt-3.5 text-center text-[11px] text-[#a8a29e]">
          Final price is confirmed at checkout.
        </p>
      </div>
    </div>
  )
}