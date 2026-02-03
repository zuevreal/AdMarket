import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Loader2, Wallet, Copy, Check } from 'lucide-react'
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react'
import WebApp from '@twa-dev/sdk'

function App() {
    const [isLoading, setIsLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const address = useTonAddress()
    const [tonConnectUI] = useTonConnectUI()

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

    // Format address for display (shortened)
    const formatAddress = (addr: string): string => {
        if (!addr) return ''
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`
    }

    // Copy address to clipboard
    const handleCopyAddress = async () => {
        if (address) {
            await navigator.clipboard.writeText(address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
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
                    {/* Wallet Status Card */}
                    {address && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full glass-card"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Wallet className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-tg-hint">Connected Wallet</p>
                                        <p className="font-mono font-medium">{formatAddress(address)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCopyAddress}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-tg-hint" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

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

                    {/* TON Connect Button */}
                    <div className="w-full mt-4">
                        <TonConnectButton className="ton-connect-button" />
                    </div>
                </motion.div>
            )}

            {/* Version */}
            <p className="absolute bottom-4 text-xs text-tg-hint">
                v0.2.0
            </p>
        </div>
    )
}

export default App
