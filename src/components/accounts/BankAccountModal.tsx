import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

type FormData = { name: string; lastFourDigits: string; balance: number; deposit: number }

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
}

const EMPTY: FormData = { name: '', lastFourDigits: '', balance: 0, deposit: 0 }

export default function BankAccountModal({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    setForm(EMPTY)
    setErrors({})
  }, [open])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Bank name is required'
    if (form.lastFourDigits && !/^\d{4}$/.test(form.lastFourDigits)) e.lastFourDigits = 'Must be 4 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSave(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Bank Account">
      <div className="flex flex-col gap-4">
        <Input label="Bank Name" placeholder="e.g. Bank Hapoalim" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
        <Input label="Last 4 Digits (optional)" placeholder="1234" maxLength={4} value={form.lastFourDigits} onChange={(e) => setForm((f) => ({ ...f, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) }))} error={errors.lastFourDigits} />
        <Input label="Current Balance (₪)" type="number" inputMode="decimal" placeholder="0" value={form.balance || ''} onChange={(e) => setForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))} />
        <Input label="Deposit Amount (₪)" type="number" inputMode="decimal" placeholder="0" value={form.deposit || ''} onChange={(e) => setForm((f) => ({ ...f, deposit: parseFloat(e.target.value) || 0 }))} />
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>Add Account</Button>
        </div>
      </div>
    </Modal>
  )
}
