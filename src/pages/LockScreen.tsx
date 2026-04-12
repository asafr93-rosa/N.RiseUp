import { useState, useEffect } from 'react'
import { ScanFace, Delete } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import { sha256 } from '../lib/crypto'

const PIN_LENGTH = 6

interface Props {
  onUnlock: () => void
}

export default function LockScreen({ onUnlock }: Props) {
  const lockSettings = useFinanceStore((s) => s.lockSettings)
  const userProfile = useFinanceStore((s) => s.userProfile)

  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [biometricError, setBiometricError] = useState('')

  const hasBiometric =
    lockSettings.biometricEnabled &&
    lockSettings.biometricCredentialId !== null &&
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential

  // Auto-try biometric on mount if enabled
  useEffect(() => {
    if (hasBiometric) {
      void tryBiometric()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when PIN is full
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      void verifyPin(pin)
    }
  }, [pin]) // eslint-disable-line react-hooks/exhaustive-deps

  async function verifyPin(entered: string) {
    const hash = await sha256(entered)
    if (hash === lockSettings.pinHash) {
      onUnlock()
    } else {
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin('')
      }, 500)
    }
  }

  async function tryBiometric() {
    if (!lockSettings.biometricCredentialId) return
    setBiometricError('')
    try {
      const credId = Uint8Array.from(
        atob(lockSettings.biometricCredentialId),
        (c) => c.charCodeAt(0)
      )
      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ id: credId, type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        },
      })
      onUnlock()
    } catch {
      setBiometricError('Face ID cancelled. Enter your PIN.')
    }
  }

  function pressDigit(d: string) {
    if (pin.length < PIN_LENGTH) setPin((p) => p + d)
  }

  function pressDelete() {
    setPin((p) => p.slice(0, -1))
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'biometric', '0', 'delete']

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 px-8"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* User identity */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: 'var(--color-card)', border: '2px solid var(--color-border)' }}
        >
          {userProfile.avatar && userProfile.avatar.startsWith('data:') ? (
            <img src={userProfile.avatar} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <span className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
              {userProfile.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {userProfile.displayName}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Enter your PIN to continue
        </p>
        {biometricError && (
          <p className="text-xs text-center" style={{ color: 'var(--color-expense)' }}>
            {biometricError}
          </p>
        )}
      </div>

      {/* PIN dots */}
      <div
        className="flex gap-4"
        style={{
          animation: shake ? 'lockShake 0.4s ease-in-out' : undefined,
        }}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all duration-150"
            style={{
              background: i < pin.length ? '#4361EE' : 'transparent',
              border: `2px solid ${i < pin.length ? '#4361EE' : 'var(--color-border)'}`,
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {keys.map((key) => {
          if (key === 'biometric') {
            return hasBiometric ? (
              <button
                key="biometric"
                onClick={() => void tryBiometric()}
                className="flex items-center justify-center h-16 rounded-2xl text-lg font-semibold active:scale-95 transition-transform"
                style={{ background: 'var(--color-card)', color: '#4361EE', border: '1px solid var(--color-border)' }}
              >
                <ScanFace size={28} />
              </button>
            ) : (
              <div key="biometric" />
            )
          }

          if (key === 'delete') {
            return (
              <button
                key="delete"
                onClick={pressDelete}
                className="flex items-center justify-center h-16 rounded-2xl text-lg font-semibold active:scale-95 transition-transform"
                style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <Delete size={22} />
              </button>
            )
          }

          return (
            <button
              key={key}
              onClick={() => pressDigit(key)}
              className="flex items-center justify-center h-16 rounded-2xl text-xl font-semibold active:scale-95 transition-transform"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              {key}
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
