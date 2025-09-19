'use client'

import { useToast } from './Toast'
import Button from './Button'

export default function ToastTest() {
  const { addToast } = useToast()

  const testSuccess = () => {
    addToast({
      type: 'success',
      title: 'Success!',
      message: 'This is a success notification test.'
    })
  }

  const testError = () => {
    addToast({
      type: 'error',
      title: 'Error!',
      message: 'This is an error notification test.'
    })
  }

  const testInfo = () => {
    addToast({
      type: 'info',
      title: 'Info!',
      message: 'This is an info notification test.'
    })
  }

  return (
    <div className="fixed bottom-4 left-4 space-x-2 z-50">
      <Button size="sm" onClick={testSuccess}>Test Success</Button>
      <Button size="sm" variant="danger" onClick={testError}>Test Error</Button>
      <Button size="sm" variant="secondary" onClick={testInfo}>Test Info</Button>
    </div>
  )
}
