import { AppTitle } from '@/app/components/header/app-title'
import { LoginForm } from '@/app/components/login/form'

export default function Login() {
  return (
    <div className="flex flex-col w-screen h-screen relative">
      <header className="w-full flex items-center justify-center h-header px-4 fixed top-0 right-0 left-0 z-20 bg-background border-b electron-drag">
        <AppTitle />
      </header>
      <main className="flex flex-col w-full h-full justify-center items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Yedits.net</h1>
          <p className="text-muted-foreground">Connect to start streaming</p>
        </div>
        <LoginForm />
        <div className="text-xs text-muted-foreground">
          Powered by <span className="font-semibold">Chuds</span>
        </div>
      </main>
    </div>
  )
}
