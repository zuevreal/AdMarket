import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Megaphone, Loader2, Wallet, Copy, Check, AlertCircle, Radio, ChevronRight } from 'lucide-react'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react'
import WebApp from '@twa-dev/sdk'
import axios from 'axios'
import MyChannels from './pages/MyChannels'

// API base URL - always use backend through the same tunnel or relative in production
const API_BASE = '/api'

type Page = 'home' | 'my-channels'

function App() {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
    const [currentPage, setCurrentPage] = useState<Page>('home')
    const wallet = useTonWallet()
    const syncedAddressRef = useRef<string | null>(null)

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

    // Sync wallet with backend
    const syncWallet = useCallback(async (walletAddress: string) => {
        if (!walletAddress) return

        // Prevent duplicate syncs for same address
        if (syncedAddressRef.current === walletAddress) {
            console.log('Wallet already synced, skipping:', walletAddress.slice(0, 8) + '...')
            return
        }

        console.log('🔄 Syncing wallet...', walletAddress)
        console.log('📱 initData available:', !!WebApp.initData)

        setSyncStatus('syncing')

        try {
            const response = await axios.post(
                `${API_BASE}/users/wallet`,
                { wallet_address: walletAddress },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Telegram-Init-Data': WebApp.initData,
                    },
                }
            )

            console.log('✅ Wallet synced successfully:', response.data)
            syncedAddressRef.current = walletAddress
            setSyncStatus('success')

            // Reset status after 3 seconds
            setTimeout(() => setSyncStatus('idle'), 3000)

        } catch (error: unknown) {
            console.error('❌ Failed to sync wallet:', error)
            if (axios.isAxiosError(error)) {
                console.error('Response:', error.response?.data)
                console.error('Status:', error.response?.status)
            }
            setSyncStatus('error')

            // Reset status after 5 seconds
            setTimeout(() => setSyncStatus('idle'), 5000)
        }
    }, [])

    // Watch for wallet connection changes using useTonWallet
    useEffect(() => {
        if (wallet?.account?.address) {
            const address = wallet.account.address
            console.log('👛 Wallet detected:', address)
            syncWallet(address)
        }
    }, [wallet, syncWallet])

    // Get display address
    const displayAddress = wallet?.account?.address || null

    // Format address for display (shortened)
    const formatAddress = (addr: string): string => {
        if (!addr) return ''
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    // Copy address to clipboard
    const handleCopyAddress = async () => {
        if (displayAddress) {
            await navigator.clipboard.writeText(displayAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Get sync status text
    const getSyncStatusText = () => {
        switch (syncStatus) {
            case 'syncing': return t('wallet_syncing')
            case 'success': return t('wallet_synced')
            case 'error': return t('wallet_sync_failed')
            default: return t('wallet_connected')
        }
    }

    // Render My Channels page
    if (currentPage === 'my-channels') {
        return <MyChannels onBack={() => setCurrentPage('home')} />
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
                    {t('app_title')}
                </h1>

                <p className="text-tg-hint mt-2 text-center">
                    {t('app_subtitle')}
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
                    <p className="text-tg-hint">{t('loading')}</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-4 w-full max-w-sm"
                >
                    {/* Wallet Status Card */}
                    {displayAddress && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full glass-card"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syncStatus === 'success' ? 'bg-green-500/20' :
                                        syncStatus === 'error' ? 'bg-red-500/20' :
                                            syncStatus === 'syncing' ? 'bg-blue-500/20' :
                                                'bg-green-500/20'
                                        }`}>
                                        {syncStatus === 'syncing' ? (
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        ) : syncStatus === 'error' ? (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <Wallet className="w-5 h-5 text-green-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-tg-hint">
                                            {getSyncStatusText()}
                                        </p>
                                        <p className="font-mono font-medium text-sm">{formatAddress(displayAddress)}</p>
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

                    {/* Navigation Cards */}
                    <div className="w-full space-y-3">
                        {/* My Channels */}
                        <button
                            onClick={() => setCurrentPage('my-channels')}
                            className="w-full glass-card flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Radio className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{t('my_channels')}</p>
                                <p className="text-xs text-tg-hint">{t('my_channels_desc')}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-tg-hint" />
                        </button>

                        {/* Find Channels */}
                        <div className="glass-card flex items-center gap-3 opacity-60">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-lg">📢</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{t('find_channels')}</p>
                                <p className="text-xs text-tg-hint">{t('find_channels_desc')}</p>
                            </div>
                            <span className="text-xs text-tg-hint">Soon</span>
                        </div>

                        {/* Secure Payments */}
                        <div className="glass-card flex items-center gap-3 opacity-60">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <span className="text-lg">💎</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{t('secure_payments')}</p>
                                <p className="text-xs text-tg-hint">{t('secure_payments_desc')}</p>
                            </div>
                            <span className="text-xs text-tg-hint">Soon</span>
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
                v0.4.0
            </p>
        </div>
    )
}

export default App
