import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Loader2 } from 'lucide-react'
import WebApp from '@twa-dev/sdk'

function App() {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Initialize Telegram WebApp
        WebApp.ready()

        // Expand to full height
        WebApp.expand()

        // Simulate initial loading
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 1500)

        return () => clearTimeout(timer)
    }, [])

    const handleMainAction = () => {
        // Placeholder for future functionality
        WebApp.showAlert('Coming soon!')
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            {/* Logo and Title */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center mb-8"
            >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                    <Megaphone className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    AdMarket
                </h1>

                <p className="text-tg-hint mt-2 text-center">
                    Telegram Channel Advertising
                </p>
            </motion.div>

            {/* Loading State */}
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                >
                    <Loader2 className="w-8 h-8 text-tg-link animate-spin" />
                    <p className="text-tg-hint">Loading...</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-4 w-full max-w-sm"
                >
                    {/* Info Cards */}
                    <div className="w-full space-y-3">
                        <div className="glass-card flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-lg">📢</span>
                            </div>
                            <div>
                                <p className="font-medium text-sm">Find Channels</p>
                                <p className="text-xs text-tg-hint">Browse verified channels</p>
                            </div>
                        </div>

                        <div className="glass-card flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <span className="text-lg">💎</span>
                            </div>
                            <div>
                                <p className="font-medium text-sm">Secure Payments</p>
                                <p className="text-xs text-tg-hint">TON escrow protection</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Action Button */}
                    <button
                        onClick={handleMainAction}
                        className="tg-button w-full mt-4"
                    >
                        Get Started
                    </button>
                </motion.div>
            )}

            {/* Version */}
            <p className="absolute bottom-4 text-xs text-tg-hint">
                v0.1.0
            </p>
        </div>
    )
}

export default App
