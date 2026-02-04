/**
 * My Channels page - list and manage user's channels.
 */

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Plus,
    Loader2,
    Trash2,
    Radio,
    Coins,
    Send,
    RefreshCw,
    Pencil
} from 'lucide-react'
import axios from 'axios'
import WebApp from '@twa-dev/sdk'
import AddChannelModal from '../components/AddChannelModal'

const API_BASE = '/api'

// Deep link for adding bot as channel admin (minimal permissions)
const BOT_USERNAME = 'chanelmarket_bot'
const ADD_BOT_DEEP_LINK = `https://t.me/${BOT_USERNAME}?startchannel&admin=post_messages`

interface Channel {
    id: number
    telegram_id: number
    username: string | null
    title: string
    description: string | null
    price_per_post: number | null
    category: string | null
    is_active: boolean
}

interface MyChannelsProps {
    onBack: () => void
}

export default function MyChannels({ onBack }: MyChannelsProps) {
    const { t } = useTranslation()
    const [channels, setChannels] = useState<Channel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Fetch channels
    const fetchChannels = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE}/channels/my`, {
                headers: {
                    'X-Telegram-Init-Data': WebApp.initData,
                },
            })
            setChannels(response.data.channels)
        } catch (error) {
            console.error('Failed to fetch channels:', error)
        }
    }, [])

    // Initial load
    useEffect(() => {
        const load = async () => {
            setIsLoading(true)
            await fetchChannels()
            setIsLoading(false)
        }
        load()
    }, [fetchChannels])

    // Refresh channels (for after deep link flow)
    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchChannels()
        setIsRefreshing(false)
    }

    const handleDeleteChannel = async (e: React.MouseEvent, channelId: number) => {
        e.stopPropagation() // Prevent opening edit modal

        if (!confirm(t('confirm_delete'))) return

        setDeletingId(channelId)
        try {
            await axios.delete(`${API_BASE}/channels/${channelId}`, {
                headers: {
                    'X-Telegram-Init-Data': WebApp.initData,
                },
            })
            setChannels(channels.filter(ch => ch.id !== channelId))
            WebApp.showAlert(t('channel_deleted'))
        } catch (error) {
            console.error('Failed to delete channel:', error)
        } finally {
            setDeletingId(null)
        }
    }

    const handleChannelSaved = (channel: Channel) => {
        if (editingChannel) {
            // Update existing channel in list
            setChannels(channels.map(ch => ch.id === channel.id ? channel : ch))
            WebApp.showAlert(t('channel_updated'))
        } else {
            // Add new channel
            setChannels([channel, ...channels])
            WebApp.showAlert(t('channel_added'))
        }
        setShowModal(false)
        setEditingChannel(null)
    }

    // Open add modal (new channel)
    const handleAddNew = () => {
        setEditingChannel(null)
        setShowModal(true)
    }

    // Open edit modal (existing channel)
    const handleEditChannel = (channel: Channel) => {
        setEditingChannel(channel)
        setShowModal(true)
    }

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false)
        setEditingChannel(null)
    }

    // Open deep link in Telegram (add bot to channel)
    const handleSelectFromTelegram = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowModal(false)

        // Use 300ms delay to let Telegram UI stabilize
        setTimeout(() => {
            try {
                if (window.Telegram?.WebApp) {
                    // Haptic feedback helps "wake up" the native bridge
                    window.Telegram.WebApp.HapticFeedback?.impactOccurred('light')
                    window.Telegram.WebApp.openTelegramLink(ADD_BOT_DEEP_LINK)
                }
            } catch (err) {
                console.error('Deep link error:', err)
            }
        }, 300)
    }

    return (
        <div className="min-h-screen p-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
            >
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-tg-link"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{t('back')}</span>
                </button>

                <h1 className="text-xl font-bold">{t('my_channels')}</h1>

                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 text-tg-hint ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </motion.div>

            {/* Add Channel Buttons */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3 mb-6"
            >
                {/* Primary: Select from Telegram (Deep Link) */}
                <button
                    onClick={handleSelectFromTelegram}
                    className="w-full glass-card flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-colors border border-blue-500/30"
                >
                    <Send className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">{t('select_from_telegram')}</span>
                </button>

                {/* Secondary: Manual add */}
                <button
                    onClick={handleAddNew}
                    className="w-full glass-card flex items-center justify-center gap-2 py-3 text-tg-hint hover:text-tg-text hover:bg-white/10 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">{t('or_add_manually')}</span>
                </button>
            </motion.div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-tg-link animate-spin" />
                    <p className="text-tg-hint mt-3">{t('loading')}</p>
                </div>
            ) : channels.length === 0 ? (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                        <Radio className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-lg font-medium mb-2">{t('no_channels')}</p>
                    <p className="text-tg-hint text-sm mb-4">{t('no_channels_hint')}</p>
                    <p className="text-xs text-tg-hint">{t('refresh_after_adding')}</p>
                </motion.div>
            ) : (
                /* Channels List */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                >
                    <AnimatePresence>
                        {channels.map((channel, index) => (
                            <motion.div
                                key={channel.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleEditChannel(channel)}
                                className="glass-card cursor-pointer hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-base">
                                                {channel.title}
                                            </h3>
                                            <Pencil className="w-3 h-3 text-tg-hint" />
                                        </div>
                                        {channel.username && (
                                            <p className="text-tg-link text-sm">
                                                @{channel.username}
                                            </p>
                                        )}
                                        {channel.description && (
                                            <p className="text-tg-hint text-sm mt-1 line-clamp-2">
                                                {channel.description}
                                            </p>
                                        )}
                                        {channel.price_per_post ? (
                                            <div className="flex items-center gap-1 mt-2 text-sm">
                                                <Coins className="w-4 h-4 text-yellow-500" />
                                                <span className="font-medium">
                                                    {parseFloat(String(channel.price_per_post))} {t('ton')}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-orange-400 mt-2">
                                                {t('set_price_hint')}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteChannel(e, channel.id)}
                                        disabled={deletingId === channel.id}
                                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-500"
                                    >
                                        {deletingId === channel.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Add/Edit Channel Modal */}
            <AddChannelModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onSuccess={handleChannelSaved}
                initialData={editingChannel}
            />
        </div>
    )
}
