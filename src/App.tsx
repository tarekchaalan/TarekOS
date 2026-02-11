import { useState } from 'react'
import { DeviceGate } from '@/shell/DeviceGate/DeviceGate'
import { Desktop } from '@/shell/Desktop/Desktop'
import { BootScreen } from '@/shell/BootSequence/BootScreen'
import { ThemeProvider } from '@/system/theme/ThemeProvider'
import { useGlobalKeyboard } from '@/system/keyboard/useGlobalKeyboard'
import { useLinkInterceptor } from '@/system/useLinkInterceptor'
import { ToastContainer } from '@/system/notifications/ToastContainer'

export default function App() {
  useGlobalKeyboard()
  useLinkInterceptor()
  const [booted, setBooted] = useState(false)

  return (
    <ThemeProvider>
      {!booted ? (
        <BootScreen onComplete={() => setBooted(true)} />
      ) : (
        <DeviceGate>
          <Desktop />
          <ToastContainer />
        </DeviceGate>
      )}
    </ThemeProvider>
  )
}
